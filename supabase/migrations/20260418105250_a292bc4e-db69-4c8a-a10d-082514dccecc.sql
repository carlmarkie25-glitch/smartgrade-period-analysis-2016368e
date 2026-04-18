-- 1. Status enum
DO $$ BEGIN
  CREATE TYPE public.student_status AS ENUM ('active','graduated','transferred','withdrawn','expelled','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Add lifecycle columns to students
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS status public.student_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS departure_date date,
  ADD COLUMN IF NOT EXISTS departure_reason text,
  ADD COLUMN IF NOT EXISTS retention_expires_at date
    GENERATED ALWAYS AS (
      CASE WHEN departure_date IS NOT NULL THEN departure_date + INTERVAL '3 years' END
    ) STORED,
  ADD COLUMN IF NOT EXISTS export_reminded_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archive_summary jsonb;

CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(status);
CREATE INDEX IF NOT EXISTS idx_students_retention ON public.students(retention_expires_at) WHERE archived_at IS NULL;

-- 3. Keep is_active in sync with status
CREATE OR REPLACE FUNCTION public.sync_student_is_active()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $fn$
BEGIN
  NEW.is_active := (NEW.status = 'active');
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_sync_student_is_active ON public.students;
CREATE TRIGGER trg_sync_student_is_active
BEFORE INSERT OR UPDATE OF status ON public.students
FOR EACH ROW EXECUTE FUNCTION public.sync_student_is_active();

-- Backfill: any non-active student should reflect that
UPDATE public.students SET status = 'active' WHERE status IS NULL;

-- 4. Mark a student as departed
CREATE OR REPLACE FUNCTION public.mark_student_departed(
  p_student_id uuid,
  p_status public.student_status,
  p_departure_date date DEFAULT CURRENT_DATE,
  p_reason text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF p_status NOT IN ('graduated','transferred','withdrawn','expelled') THEN
    RAISE EXCEPTION 'Invalid departure status: %', p_status;
  END IF;
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can mark students as departed';
  END IF;
  UPDATE public.students
     SET status = p_status,
         departure_date = COALESCE(departure_date, p_departure_date),
         departure_reason = COALESCE(p_reason, departure_reason),
         is_active = false,
         updated_at = now()
   WHERE id = p_student_id;
END;
$fn$;

-- 5. Archive expired student records (anonymize + summarize)
CREATE OR REPLACE FUNCTION public.archive_expired_students()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_count integer := 0;
  s record;
  v_summary jsonb;
BEGIN
  FOR s IN
    SELECT *
      FROM public.students
     WHERE archived_at IS NULL
       AND status IN ('graduated','transferred','withdrawn','expelled')
       AND retention_expires_at IS NOT NULL
       AND retention_expires_at <= CURRENT_DATE
  LOOP
    v_summary := jsonb_build_object(
      'student_id', s.student_id,
      'gender', s.gender,
      'department_id', s.department_id,
      'class_id_at_departure', s.class_id,
      'enrolled_from', s.created_at,
      'departure_date', s.departure_date,
      'departure_reason', s.departure_reason,
      'final_status', s.status,
      'grade_count', (SELECT COUNT(*) FROM public.student_grades WHERE student_id = s.id),
      'attendance_count', (SELECT COUNT(*) FROM public.attendance_records WHERE student_id = s.id),
      'total_paid', (SELECT COALESCE(SUM(amount),0) FROM public.student_payments WHERE student_id = s.id)
    );

    -- Anonymize PII
    UPDATE public.students SET
      full_name = 'Archived Student',
      photo_url = NULL,
      phone_number = NULL,
      address = NULL,
      father_name = NULL, father_contact = NULL,
      mother_name = NULL, mother_contact = NULL,
      emergency_contact_name = NULL,
      emergency_contact_phone = NULL,
      emergency_contact_relationship = NULL,
      health_issues = NULL, disability = NULL,
      previous_school = NULL, previous_class = NULL,
      ethnicity = NULL, religion = NULL, county = NULL,
      date_of_birth = NULL,
      status = 'archived',
      archived_at = now(),
      archive_summary = v_summary,
      is_active = false,
      updated_at = now()
    WHERE id = s.id;

    -- Drop heavy related rows; archive_summary keeps aggregates
    DELETE FROM public.student_grades WHERE student_id = s.id;
    DELETE FROM public.attendance_records WHERE student_id = s.id;
    DELETE FROM public.student_period_totals WHERE student_id = s.id;
    DELETE FROM public.student_yearly_totals WHERE student_id = s.id;
    DELETE FROM public.student_report_inputs WHERE student_id = s.id;

    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$fn$;

-- 6. Helper to list students approaching retention expiry
CREATE OR REPLACE FUNCTION public.students_expiring_within(p_days integer)
RETURNS TABLE(student_id uuid, full_name text, school_id uuid, retention_expires_at date, days_left integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT id, full_name, school_id, retention_expires_at,
         (retention_expires_at - CURRENT_DATE)::int AS days_left
    FROM public.students
   WHERE archived_at IS NULL
     AND status IN ('graduated','transferred','withdrawn','expelled')
     AND retention_expires_at IS NOT NULL
     AND retention_expires_at - CURRENT_DATE BETWEEN 0 AND p_days;
$fn$;

-- 7. Update billable-seats to use status instead of is_active
CREATE OR REPLACE FUNCTION public.count_active_students(p_school_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT COUNT(*)::int FROM public.students
   WHERE school_id = p_school_id AND status = 'active';
$fn$;

-- 8. student_data_exports table (Transfer Pack / archival exports)
CREATE TABLE IF NOT EXISTS public.student_data_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  export_type text NOT NULL DEFAULT 'transfer_pack',
  storage_path text,
  share_token text UNIQUE DEFAULT encode(gen_random_bytes(24),'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + INTERVAL '14 days'),
  download_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exports_student ON public.student_data_exports(student_id);
CREATE INDEX IF NOT EXISTS idx_exports_school ON public.student_data_exports(school_id);

ALTER TABLE public.student_data_exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage student exports" ON public.student_data_exports;
CREATE POLICY "Admins manage student exports"
ON public.student_data_exports FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));