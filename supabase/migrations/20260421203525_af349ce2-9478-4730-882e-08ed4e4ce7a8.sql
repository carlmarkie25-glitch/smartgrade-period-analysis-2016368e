-- 1. Create enrollment history table
CREATE TABLE public.student_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  class_id uuid NOT NULL,
  academic_year_id uuid NOT NULL,
  school_id uuid,
  status text NOT NULL DEFAULT 'active',
  final_average numeric,
  reason text,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, academic_year_id)
);

CREATE INDEX idx_student_enrollments_student ON public.student_enrollments(student_id);
CREATE INDEX idx_student_enrollments_year ON public.student_enrollments(academic_year_id);
CREATE INDEX idx_student_enrollments_class ON public.student_enrollments(class_id);
CREATE INDEX idx_student_enrollments_school ON public.student_enrollments(school_id);

-- 2. Auto-fill school_id from student
CREATE OR REPLACE FUNCTION public.student_enrollments_set_school()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.school_id IS NULL THEN
    SELECT school_id INTO NEW.school_id FROM public.students WHERE id = NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_student_enrollments_set_school
BEFORE INSERT ON public.student_enrollments
FOR EACH ROW EXECUTE FUNCTION public.student_enrollments_set_school();

CREATE TRIGGER trg_student_enrollments_updated_at
BEFORE UPDATE ON public.student_enrollments
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. RLS
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage enrollments in own school"
ON public.student_enrollments
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND (school_id = current_school_id() OR is_super_admin()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND (school_id = current_school_id() OR is_super_admin()));

CREATE POLICY "VPI manage enrollments"
ON public.student_enrollments
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'vpi'::app_role))
WITH CHECK (has_role(auth.uid(), 'vpi'::app_role));

CREATE POLICY "Registrar manage enrollments"
ON public.student_enrollments
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'registrar'::app_role))
WITH CHECK (has_role(auth.uid(), 'registrar'::app_role));

CREATE POLICY "Teachers view enrollments for their classes"
ON public.student_enrollments
FOR SELECT TO authenticated
USING (
  class_id IN (
    SELECT id FROM public.classes WHERE teacher_id = auth.uid()
    UNION
    SELECT class_id FROM public.class_subjects WHERE teacher_id = auth.uid()
    UNION
    SELECT class_id FROM public.sponsor_class_assignments WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Students view own enrollments"
ON public.student_enrollments
FOR SELECT TO authenticated
USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

CREATE POLICY "Parents view children enrollments"
ON public.student_enrollments
FOR SELECT TO authenticated
USING (
  student_id IN (
    SELECT student_id FROM public.parent_student_assignments
    WHERE parent_user_id = auth.uid()
  )
);

-- 4. Backfill: create one 'active' enrollment for every existing student
INSERT INTO public.student_enrollments (student_id, class_id, academic_year_id, school_id, status)
SELECT s.id, s.class_id, c.academic_year_id, s.school_id, 'active'
FROM public.students s
JOIN public.classes c ON c.id = s.class_id
WHERE s.class_id IS NOT NULL
ON CONFLICT (student_id, academic_year_id) DO NOTHING;
