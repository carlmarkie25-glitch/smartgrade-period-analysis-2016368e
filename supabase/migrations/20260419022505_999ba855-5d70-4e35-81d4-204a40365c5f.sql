
-- Report card settings per school
CREATE TABLE IF NOT EXISTS public.report_card_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
  -- Header / branding (overrides school defaults if set)
  header_title text,
  header_subtitle text,
  header_address text,
  header_contact text,
  header_website text,
  logo_url text,
  -- Grading thresholds (percentages 0-100)
  pass_mark integer NOT NULL DEFAULT 60,
  grade_a_min integer NOT NULL DEFAULT 90,
  grade_b_min integer NOT NULL DEFAULT 80,
  grade_c_min integer NOT NULL DEFAULT 70,
  grade_d_min integer NOT NULL DEFAULT 60,
  -- Labels for grade bands
  grade_a_label text NOT NULL DEFAULT 'Excellent',
  grade_b_label text NOT NULL DEFAULT 'Very Good',
  grade_c_label text NOT NULL DEFAULT 'Good Standing',
  grade_d_label text NOT NULL DEFAULT 'Satisfactory',
  grade_f_label text NOT NULL DEFAULT 'Needs Improvement',
  -- Signatories
  default_administrator_name text,
  default_class_teacher_name text,
  -- Footer note
  footer_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.report_card_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View report card settings in own school"
  ON public.report_card_settings FOR SELECT
  TO authenticated
  USING (school_id = current_school_id() OR is_super_admin());

CREATE POLICY "Admins manage report card settings"
  ON public.report_card_settings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND school_id = current_school_id())
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND school_id = current_school_id());

CREATE TRIGGER set_report_card_settings_school_id
  BEFORE INSERT ON public.report_card_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_school_id_from_user();

CREATE TRIGGER update_report_card_settings_updated_at
  BEFORE UPDATE ON public.report_card_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
