CREATE TABLE IF NOT EXISTS public.subject_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subject_id, department_id)
);

CREATE INDEX IF NOT EXISTS idx_subject_departments_subject ON public.subject_departments(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_departments_department ON public.subject_departments(department_id);

ALTER TABLE public.subject_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage subject_departments"
ON public.subject_departments
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "View subject_departments in own school"
ON public.subject_departments
FOR SELECT
TO authenticated
USING ((school_id = current_school_id()) OR is_super_admin());

-- Backfill from the existing single department_id column on subjects
INSERT INTO public.subject_departments (subject_id, department_id, school_id)
SELECT s.id, s.department_id, s.school_id
FROM public.subjects s
WHERE s.department_id IS NOT NULL
ON CONFLICT (subject_id, department_id) DO NOTHING;