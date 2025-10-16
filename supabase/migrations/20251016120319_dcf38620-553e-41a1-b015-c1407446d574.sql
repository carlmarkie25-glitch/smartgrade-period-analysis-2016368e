-- Fix student_grades table RLS - restrict access to authorized users only
DROP POLICY IF EXISTS "Anyone can view grades" ON public.student_grades;

CREATE POLICY "Students can view their own grades"
ON public.student_grades
FOR SELECT
TO authenticated
USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can view grades for their students"
ON public.student_grades
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND
  class_subject_id IN (
    SELECT cs.id 
    FROM public.class_subjects cs
    JOIN public.classes c ON cs.class_id = c.id
    WHERE c.teacher_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all grades"
ON public.student_grades
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));