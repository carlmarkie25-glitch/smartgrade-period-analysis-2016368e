
-- Create sponsor_class_assignments table
CREATE TABLE public.sponsor_class_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, class_id)
);

-- Enable RLS
ALTER TABLE public.sponsor_class_assignments ENABLE ROW LEVEL SECURITY;

-- Admins can manage all sponsor assignments
CREATE POLICY "Admins can manage sponsor assignments"
ON public.sponsor_class_assignments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own sponsor assignments
CREATE POLICY "Users can view their own sponsor assignments"
ON public.sponsor_class_assignments
FOR SELECT
USING (user_id = auth.uid());
