-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admins can manage class subjects" ON public.class_subjects;

-- Create new policies that allow both admins and teachers to manage class subjects
CREATE POLICY "Admins and teachers can manage class subjects"
ON public.class_subjects
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'teacher'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'teacher'::app_role)
);