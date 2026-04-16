
-- Table to store teacher input fields for each student report (per period)
CREATE TABLE public.student_report_inputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  -- Conduct ratings
  behavior TEXT,
  punctuality TEXT,
  participation TEXT,
  homework TEXT,
  -- Teacher remarks
  teacher_comment TEXT,
  excels_in TEXT,
  can_improve_in TEXT,
  -- Signatures / metadata
  administrator_name TEXT,
  class_teacher_name TEXT,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, period)
);

ALTER TABLE public.student_report_inputs ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins manage report inputs"
  ON public.student_report_inputs
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Teachers (including sponsors) can view & edit for students in their classes
CREATE POLICY "Teachers manage their students report inputs"
  ON public.student_report_inputs
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'teacher'::public.app_role)
    AND student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.classes c ON s.class_id = c.id
      WHERE c.teacher_id = auth.uid()
      UNION
      SELECT s.id FROM public.students s
      JOIN public.sponsor_class_assignments sca ON s.class_id = sca.class_id
      WHERE sca.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'teacher'::public.app_role)
    AND student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.classes c ON s.class_id = c.id
      WHERE c.teacher_id = auth.uid()
      UNION
      SELECT s.id FROM public.students s
      JOIN public.sponsor_class_assignments sca ON s.class_id = sca.class_id
      WHERE sca.user_id = auth.uid()
    )
  );

-- Students can view their own
CREATE POLICY "Students view own report inputs"
  ON public.student_report_inputs
  FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

-- Parents can view their children's
CREATE POLICY "Parents view children report inputs"
  ON public.student_report_inputs
  FOR SELECT
  USING (student_id IN (
    SELECT student_id FROM public.parent_student_assignments WHERE parent_user_id = auth.uid()
  ));

CREATE TRIGGER set_student_report_inputs_updated_at
  BEFORE UPDATE ON public.student_report_inputs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
