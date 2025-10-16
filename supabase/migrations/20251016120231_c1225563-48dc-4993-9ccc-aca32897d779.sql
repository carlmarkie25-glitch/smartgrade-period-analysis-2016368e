-- Fix profiles table RLS - restrict to own profile only
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix students table RLS - implement role-based access
DROP POLICY IF EXISTS "Anyone can view students" ON public.students;
DROP POLICY IF EXISTS "Users can view their own student record" ON public.students;
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON public.students;
DROP POLICY IF EXISTS "Admins can view all students" ON public.students;

CREATE POLICY "Users can view their own student record"
ON public.students
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Teachers can view students in their classes"
ON public.students
FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND
  class_id IN (
    SELECT id FROM public.classes WHERE teacher_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all students"
ON public.students
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));