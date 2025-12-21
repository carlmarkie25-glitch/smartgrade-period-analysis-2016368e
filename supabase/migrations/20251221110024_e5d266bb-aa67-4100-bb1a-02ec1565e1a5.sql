-- Drop the existing overly permissive policy for teachers managing grades
DROP POLICY IF EXISTS "Admins and teachers can manage grades" ON public.student_grades;

-- Create separate policies for admins and teachers with proper restrictions

-- Admins can manage all grades (full access)
CREATE POLICY "Admins can manage all grades" 
ON public.student_grades 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Teachers can only manage grades for students in their classes
CREATE POLICY "Teachers can manage grades for their classes" 
ON public.student_grades 
FOR ALL 
USING (
  has_role(auth.uid(), 'teacher'::app_role) 
  AND class_subject_id IN (
    SELECT cs.id 
    FROM class_subjects cs 
    JOIN classes c ON cs.class_id = c.id 
    WHERE c.teacher_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'teacher'::app_role) 
  AND class_subject_id IN (
    SELECT cs.id 
    FROM class_subjects cs 
    JOIN classes c ON cs.class_id = c.id 
    WHERE c.teacher_id = auth.uid()
  )
);