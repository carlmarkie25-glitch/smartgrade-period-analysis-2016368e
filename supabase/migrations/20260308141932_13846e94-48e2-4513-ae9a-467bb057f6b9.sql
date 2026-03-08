
-- Create parent_student_assignments table to link parents to students
CREATE TABLE public.parent_student_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_user_id UUID NOT NULL,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(parent_user_id, student_id)
);

-- Enable RLS
ALTER TABLE public.parent_student_assignments ENABLE ROW LEVEL SECURITY;

-- Admins can manage all assignments
CREATE POLICY "Admins can manage parent assignments"
ON public.parent_student_assignments
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Parents can view their own assignments
CREATE POLICY "Parents can view their own assignments"
ON public.parent_student_assignments
FOR SELECT
TO authenticated
USING (parent_user_id = auth.uid());
