
-- Update get_teacher_students to also include students from sponsored classes
CREATE OR REPLACE FUNCTION public.get_teacher_students()
RETURNS TABLE(
  id uuid, student_id text, full_name text, class_id uuid, department_id uuid,
  photo_url text, gender text, date_of_birth date, user_id uuid,
  created_at timestamp with time zone, updated_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT
    s.id, s.student_id, s.full_name, s.class_id, s.department_id,
    s.photo_url, s.gender, s.date_of_birth, s.user_id, s.created_at, s.updated_at
  FROM students s
  JOIN classes c ON s.class_id = c.id
  WHERE (c.teacher_id = auth.uid() AND has_role(auth.uid(), 'teacher'))
  UNION
  SELECT DISTINCT
    s.id, s.student_id, s.full_name, s.class_id, s.department_id,
    s.photo_url, s.gender, s.date_of_birth, s.user_id, s.created_at, s.updated_at
  FROM students s
  JOIN sponsor_class_assignments sca ON s.class_id = sca.class_id
  WHERE sca.user_id = auth.uid()
$$;
