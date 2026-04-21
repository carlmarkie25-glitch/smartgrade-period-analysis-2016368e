
-- 1) Create grade_locks table
CREATE TABLE public.grade_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_subject_id uuid NOT NULL REFERENCES public.class_subjects(id) ON DELETE CASCADE,
  period public.period_type NOT NULL,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  is_locked boolean NOT NULL DEFAULT false,
  is_released boolean NOT NULL DEFAULT false,
  locked_by uuid,
  locked_at timestamptz,
  released_by uuid,
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_subject_id, period)
);

CREATE INDEX idx_grade_locks_cs_period ON public.grade_locks(class_subject_id, period);
CREATE INDEX idx_grade_locks_school ON public.grade_locks(school_id);

ALTER TABLE public.grade_locks ENABLE ROW LEVEL SECURITY;

-- Auto-fill school_id from class_subject if not provided
CREATE OR REPLACE FUNCTION public.grade_locks_set_school()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.school_id IS NULL THEN
    SELECT school_id INTO NEW.school_id
    FROM public.class_subjects WHERE id = NEW.class_subject_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_grade_locks_set_school
BEFORE INSERT ON public.grade_locks
FOR EACH ROW EXECUTE FUNCTION public.grade_locks_set_school();

CREATE TRIGGER trg_grade_locks_updated_at
BEFORE UPDATE ON public.grade_locks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper: is a class_subject+period currently locked?
CREATE OR REPLACE FUNCTION public.is_grade_locked(_class_subject_id uuid, _period public.period_type)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_locked FROM public.grade_locks
      WHERE class_subject_id = _class_subject_id AND period = _period
      LIMIT 1),
    false
  );
$$;

-- RLS for grade_locks
CREATE POLICY "View grade_locks in own school"
  ON public.grade_locks FOR SELECT
  TO authenticated
  USING (school_id = current_school_id() OR is_super_admin());

CREATE POLICY "Admins manage grade_locks"
  ON public.grade_locks FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Teachers can submit (insert/update is_locked=true) for class_subjects they teach
CREATE POLICY "Teachers can submit lock for own class_subject"
  ON public.grade_locks FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'teacher'::app_role)
    AND class_subject_id IN (
      SELECT cs.id FROM public.class_subjects cs
      LEFT JOIN public.classes c ON c.id = cs.class_id
      WHERE cs.teacher_id = auth.uid() OR c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can lock own class_subject"
  ON public.grade_locks FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'teacher'::app_role)
    AND is_locked = false
    AND class_subject_id IN (
      SELECT cs.id FROM public.class_subjects cs
      LEFT JOIN public.classes c ON c.id = cs.class_id
      WHERE cs.teacher_id = auth.uid() OR c.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'teacher'::app_role)
    AND class_subject_id IN (
      SELECT cs.id FROM public.class_subjects cs
      LEFT JOIN public.classes c ON c.id = cs.class_id
      WHERE cs.teacher_id = auth.uid() OR c.teacher_id = auth.uid()
    )
  );

-- 2) Update student_grades teacher policy to block edits when locked
DROP POLICY IF EXISTS "Teachers can manage grades for their classes" ON public.student_grades;

CREATE POLICY "Teachers can manage grades for their classes"
  ON public.student_grades FOR ALL
  USING (
    has_role(auth.uid(), 'teacher'::app_role)
    AND class_subject_id IN (
      SELECT cs.id FROM public.class_subjects cs
      JOIN public.classes c ON cs.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
    AND NOT public.is_grade_locked(class_subject_id, period)
  )
  WITH CHECK (
    has_role(auth.uid(), 'teacher'::app_role)
    AND class_subject_id IN (
      SELECT cs.id FROM public.class_subjects cs
      JOIN public.classes c ON cs.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
    AND NOT public.is_grade_locked(class_subject_id, period)
  );
