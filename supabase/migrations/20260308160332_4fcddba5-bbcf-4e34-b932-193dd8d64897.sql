
-- Fee categories (line items like Admission fees, Maintenance fees, etc.)
CREATE TABLE public.fee_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  is_registration boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fee_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fee categories" ON public.fee_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view fee categories" ON public.fee_categories FOR SELECT
  USING (true);

-- Division fee rates (amount per category per department per academic year)
CREATE TABLE public.division_fee_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_category_id uuid NOT NULL REFERENCES public.fee_categories(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(fee_category_id, department_id, academic_year_id)
);

ALTER TABLE public.division_fee_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage division fee rates" ON public.division_fee_rates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view division fee rates" ON public.division_fee_rates FOR SELECT
  USING (true);

-- Installment plans per department per academic year
CREATE TABLE public.installment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  installment_number int NOT NULL,
  label text NOT NULL,
  period_label text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(department_id, academic_year_id, installment_number)
);

ALTER TABLE public.installment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage installment plans" ON public.installment_plans FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view installment plans" ON public.installment_plans FOR SELECT
  USING (true);

-- Seed the default fee categories from the image
INSERT INTO public.fee_categories (name, display_order, is_registration) VALUES
  ('Admission Fees', 1, true),
  ('Maintenance Fees', 2, true),
  ('Hand Book', 3, true),
  ('ID Card', 4, true),
  ('Sport Fees', 5, true),
  ('PE Suit', 6, true),
  ('Wednesday Uniform', 7, true),
  ('Stationeries', 8, true),
  ('Toiletries', 9, true),
  ('PTA Fees', 10, true),
  ('Information Form', 11, true),
  ('Gala Day', 12, true),
  ('Project Fund', 13, true);
