-- Fix: Remove the race condition vulnerability in first admin assignment
-- After the first admin is created, this policy is no longer needed and creates a security risk
DROP POLICY IF EXISTS "Allow first admin assignment" ON public.user_roles;

-- Create a more secure policy: Only existing admins can create new admins
CREATE POLICY "Only admins can assign roles"
ON public.user_roles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix: Restrict teacher photo access to only their assigned students
DROP POLICY IF EXISTS "Teachers can view their students' photos" ON storage.objects;

CREATE POLICY "Teachers can view their class students photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'student-photos' AND
  has_role(auth.uid(), 'teacher'::app_role) AND
  EXISTS (
    SELECT 1 FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE c.teacher_id = auth.uid()
    AND s.photo_url LIKE '%' || name || '%'
  )
);