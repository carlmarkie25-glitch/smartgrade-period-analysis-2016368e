-- Step 1: Drop the overly permissive teacher SELECT policy
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON public.students;

-- Step 2: Create a secure function that returns limited student data for teachers
-- Teachers only get academic-related fields, NOT sensitive PII like health info, parent contacts
CREATE OR REPLACE FUNCTION public.get_teacher_students()
RETURNS TABLE (
  id uuid,
  student_id text,
  full_name text,
  class_id uuid,
  department_id uuid,
  photo_url text,
  gender text,
  date_of_birth date,
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.student_id,
    s.full_name,
    s.class_id,
    s.department_id,
    s.photo_url,
    s.gender,
    s.date_of_birth,
    s.user_id,
    s.created_at,
    s.updated_at
  FROM students s
  JOIN classes c ON s.class_id = c.id
  WHERE c.teacher_id = auth.uid()
    AND has_role(auth.uid(), 'teacher')
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_teacher_students() TO authenticated;