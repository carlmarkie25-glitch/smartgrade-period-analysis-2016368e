
-- Add school-wide report card color defaults
ALTER TABLE public.report_card_settings
  ADD COLUMN IF NOT EXISTS header_bg_color text NOT NULL DEFAULT '#1a2a6e',
  ADD COLUMN IF NOT EXISTS accent_color text NOT NULL DEFAULT '#c8a84b',
  ADD COLUMN IF NOT EXISTS secondary_bg_color text NOT NULL DEFAULT '#2a5298';

-- Per-department color overrides
CREATE TABLE IF NOT EXISTS public.department_report_colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  header_bg_color text,
  accent_color text,
  secondary_bg_color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, department_id)
);

ALTER TABLE public.department_report_colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View dept report colors in own school"
  ON public.department_report_colors
  FOR SELECT
  TO authenticated
  USING (school_id = current_school_id() OR is_super_admin());

CREATE POLICY "Admins manage dept report colors"
  ON public.department_report_colors
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::public.app_role) AND school_id = current_school_id())
  WITH CHECK (has_role(auth.uid(), 'admin'::public.app_role) AND school_id = current_school_id());

CREATE TRIGGER set_dept_report_colors_updated_at
  BEFORE UPDATE ON public.department_report_colors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_dept_report_colors_school_id
  BEFORE INSERT ON public.department_report_colors
  FOR EACH ROW EXECUTE FUNCTION public.set_school_id_from_user();
