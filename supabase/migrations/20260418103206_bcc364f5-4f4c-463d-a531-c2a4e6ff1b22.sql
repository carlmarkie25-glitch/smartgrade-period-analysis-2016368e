CREATE POLICY "Parents can view their linked children"
ON public.students
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT student_id FROM public.parent_student_assignments
    WHERE parent_user_id = auth.uid()
  )
);