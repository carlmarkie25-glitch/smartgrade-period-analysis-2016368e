-- table to store weekly class schedule entries (timetable)
CREATE TABLE public.class_schedules (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  day_of_week INT NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Row level security for class schedules
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;

-- Admins can manage everything
CREATE POLICY "Admins can manage class schedules"
ON public.class_schedules
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Everyone can read schedule entries (so teachers/students see their timetable)
CREATE POLICY "Public select on class schedules"
ON public.class_schedules
FOR SELECT
USING (true);

-- Teachers can insert/update only entries where they are assigned (optional)
CREATE POLICY "Teachers manage own schedule entries"
ON public.class_schedules
FOR INSERT, UPDATE, DELETE
WITH CHECK (teacher_id = auth.uid());
