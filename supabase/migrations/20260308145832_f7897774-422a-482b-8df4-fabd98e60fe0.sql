
-- Table for recurring class timetable entries (e.g. "Grade 10 Math every Monday 8-9am")
CREATE TABLE public.class_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view schedules
CREATE POLICY "Authenticated users can view class schedules"
  ON public.class_schedules FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage class schedules
CREATE POLICY "Admins can insert class schedules"
  ON public.class_schedules FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update class schedules"
  ON public.class_schedules FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete class schedules"
  ON public.class_schedules FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Table for personal/ad-hoc schedule entries
CREATE TABLE public.schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject TEXT,
  location TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Users can view their own schedules
CREATE POLICY "Users can view own schedules"
  ON public.schedules FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own schedules
CREATE POLICY "Users can insert own schedules"
  ON public.schedules FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own schedules
CREATE POLICY "Users can update own schedules"
  ON public.schedules FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Users can delete their own schedules
CREATE POLICY "Users can delete own schedules"
  ON public.schedules FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can manage all schedules
CREATE POLICY "Admins can manage all schedules"
  ON public.schedules FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
