
CREATE TABLE public.academic_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type text NOT NULL,
  label text NOT NULL,
  semester text NOT NULL DEFAULT 'semester1',
  start_date date NOT NULL,
  end_date date NOT NULL,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(period_type, academic_year_id)
);

ALTER TABLE public.academic_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage academic periods"
ON public.academic_periods
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view academic periods"
ON public.academic_periods
FOR SELECT
TO authenticated
USING (true);
