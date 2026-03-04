-- create schedules table for storing daily user schedules
CREATE TABLE public.schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- enable row level security
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- admins can manage all schedule entries
CREATE POLICY "Admins can manage schedules"
ON public.schedules
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- users can view their own schedule entries
CREATE POLICY "Users can view their own schedules"
ON public.schedules
FOR SELECT
USING (user_id = auth.uid());

-- users can insert or update only their own entries
CREATE POLICY "Users can manage their schedules"
ON public.schedules
FOR INSERT, UPDATE, DELETE
WITH CHECK (user_id = auth.uid());
