
-- Status enum
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'excused');

-- Sessions: one per class+date (+ optional subject for per-period attendance)
CREATE TABLE public.attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  class_subject_id uuid REFERENCES public.class_subjects(id) ON DELETE SET NULL,
  date date NOT NULL,
  taken_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, class_subject_id, date)
);

CREATE INDEX idx_att_sessions_class_date ON public.attendance_sessions(class_id, date DESC);
CREATE INDEX idx_att_sessions_school ON public.attendance_sessions(school_id);

-- Records: one per student per session
CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status public.attendance_status NOT NULL DEFAULT 'present',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, student_id)
);

CREATE INDEX idx_att_records_student ON public.attendance_records(student_id);
CREATE INDEX idx_att_records_session ON public.attendance_records(session_id);

-- updated_at triggers
CREATE TRIGGER trg_att_sessions_updated
  BEFORE UPDATE ON public.attendance_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_att_records_updated
  BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper: can current user manage attendance for a given class?
CREATE OR REPLACE FUNCTION public.can_manage_class_attendance(_class_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = _class_id AND c.teacher_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.class_subjects cs WHERE cs.class_id = _class_id AND cs.teacher_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.sponsor_class_assignments sca WHERE sca.class_id = _class_id AND sca.user_id = auth.uid());
$$;

-- RLS
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Sessions policies
CREATE POLICY "Admins manage all attendance sessions"
  ON public.attendance_sessions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers manage attendance for their classes"
  ON public.attendance_sessions FOR ALL
  USING (public.can_manage_class_attendance(class_id))
  WITH CHECK (public.can_manage_class_attendance(class_id));

CREATE POLICY "Students view their class attendance sessions"
  ON public.attendance_sessions FOR SELECT
  USING (
    class_id IN (SELECT class_id FROM public.students WHERE user_id = auth.uid())
  );

CREATE POLICY "Parents view their children's attendance sessions"
  ON public.attendance_sessions FOR SELECT
  USING (
    class_id IN (
      SELECT s.class_id FROM public.students s
      JOIN public.parent_student_assignments psa ON psa.student_id = s.id
      WHERE psa.parent_user_id = auth.uid()
    )
  );

-- Records policies
CREATE POLICY "Admins manage all attendance records"
  ON public.attendance_records FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers manage attendance records for their classes"
  ON public.attendance_records FOR ALL
  USING (
    session_id IN (
      SELECT id FROM public.attendance_sessions
      WHERE public.can_manage_class_attendance(class_id)
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.attendance_sessions
      WHERE public.can_manage_class_attendance(class_id)
    )
  );

CREATE POLICY "Students view own attendance records"
  ON public.attendance_records FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Parents view children attendance records"
  ON public.attendance_records FOR SELECT
  USING (
    student_id IN (
      SELECT student_id FROM public.parent_student_assignments WHERE parent_user_id = auth.uid()
    )
  );
