
-- Allow teachers to view students in classes they teach (via class_subjects)
CREATE POLICY "Teachers can view students in their classes"
ON public.students
FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND (
    class_id IN (
      SELECT DISTINCT cs.class_id FROM class_subjects cs WHERE cs.teacher_id = auth.uid()
    )
    OR
    class_id IN (
      SELECT sca.class_id FROM sponsor_class_assignments sca WHERE sca.user_id = auth.uid()
    )
  )
);
