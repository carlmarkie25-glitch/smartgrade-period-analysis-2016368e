-- Fix 1: Restrict student_period_totals access to proper roles
DROP POLICY IF EXISTS "Anyone can view period totals" ON public.student_period_totals;

CREATE POLICY "Students can view their own period totals" 
ON public.student_period_totals
FOR SELECT 
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can view their students' period totals" 
ON public.student_period_totals
FOR SELECT 
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND
  student_id IN (
    SELECT s.id FROM students s 
    JOIN classes c ON s.class_id = c.id 
    WHERE c.teacher_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all period totals" 
ON public.student_period_totals
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Restrict student_yearly_totals access to proper roles
DROP POLICY IF EXISTS "Anyone can view yearly totals" ON public.student_yearly_totals;

CREATE POLICY "Students can view their own yearly totals" 
ON public.student_yearly_totals
FOR SELECT 
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can view their students' yearly totals" 
ON public.student_yearly_totals
FOR SELECT 
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND
  student_id IN (
    SELECT s.id FROM students s 
    JOIN classes c ON s.class_id = c.id 
    WHERE c.teacher_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all yearly totals" 
ON public.student_yearly_totals
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 3: Make student-photos bucket private and add role-based policies
UPDATE storage.buckets SET public = false WHERE id = 'student-photos';

DROP POLICY IF EXISTS "Anyone can view student photos" ON storage.objects;

CREATE POLICY "Students can view their own photo" 
ON storage.objects
FOR SELECT 
USING (
  bucket_id = 'student-photos' AND
  auth.uid() IN (SELECT user_id FROM students WHERE photo_url LIKE '%' || name || '%')
);

CREATE POLICY "Teachers can view their students' photos" 
ON storage.objects
FOR SELECT 
USING (
  bucket_id = 'student-photos' AND
  has_role(auth.uid(), 'teacher'::app_role)
);

CREATE POLICY "Admins can view all student photos" 
ON storage.objects
FOR SELECT 
USING (
  bucket_id = 'student-photos' AND
  has_role(auth.uid(), 'admin'::app_role)
);