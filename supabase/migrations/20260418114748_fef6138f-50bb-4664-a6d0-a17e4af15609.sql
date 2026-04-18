-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  actor_user_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_school ON public.audit_logs(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view their school audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
  is_super_admin()
  OR (has_role(auth.uid(), 'admin'::app_role) AND school_id = current_school_id())
);

CREATE POLICY "Authenticated can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (actor_user_id = auth.uid() OR actor_user_id IS NULL);

-- Helper to write audit entries
CREATE OR REPLACE FUNCTION public.write_audit_log(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (school_id, actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (current_school_id(), auth.uid(), p_action, p_entity_type, p_entity_id, COALESCE(p_metadata, '{}'::jsonb));
END;
$$;

-- Update mark_student_departed to log
CREATE OR REPLACE FUNCTION public.mark_student_departed(
  p_student_id uuid,
  p_status student_status,
  p_departure_date date DEFAULT CURRENT_DATE,
  p_reason text DEFAULT NULL::text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  PERFORM public.write_audit_log(
    'student.marked_departed',
    'student',
    p_student_id,
    jsonb_build_object('status', p_status, 'departure_date', p_departure_date, 'reason', p_reason)
  );
END;
$$;

-- Enable required extensions for cron retention
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;