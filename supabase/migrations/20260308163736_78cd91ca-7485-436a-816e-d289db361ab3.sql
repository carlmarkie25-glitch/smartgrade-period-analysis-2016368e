
-- Student bills: one row per student per academic year, auto-generated
CREATE TABLE public.student_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  registration_total numeric NOT NULL DEFAULT 0,
  tuition_total numeric NOT NULL DEFAULT 0,
  grand_total numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  balance numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, academic_year_id)
);

ALTER TABLE public.student_bills ENABLE ROW LEVEL SECURITY;

-- Bill line items: breakdown of each charge
CREATE TABLE public.student_bill_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES public.student_bills(id) ON DELETE CASCADE,
  item_type text NOT NULL DEFAULT 'registration', -- 'registration' or 'installment'
  item_name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_bill_items ENABLE ROW LEVEL SECURITY;

-- Student payments linked to bills
CREATE TABLE public.student_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES public.student_bills(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_method text NOT NULL DEFAULT 'cash',
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  receipt_number text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_payments ENABLE ROW LEVEL SECURITY;

-- RLS for student_bills
CREATE POLICY "Admins can manage student bills" ON public.student_bills FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view own bills" ON public.student_bills FOR SELECT TO authenticated
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Parents can view children bills" ON public.student_bills FOR SELECT TO authenticated
  USING (student_id IN (SELECT student_id FROM parent_student_assignments WHERE parent_user_id = auth.uid()));

-- RLS for student_bill_items
CREATE POLICY "Admins can manage bill items" ON public.student_bill_items FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view own bill items" ON public.student_bill_items FOR SELECT TO authenticated
  USING (bill_id IN (SELECT id FROM student_bills WHERE student_id IN (SELECT id FROM students WHERE user_id = auth.uid())));

CREATE POLICY "Parents can view children bill items" ON public.student_bill_items FOR SELECT TO authenticated
  USING (bill_id IN (SELECT id FROM student_bills WHERE student_id IN (SELECT student_id FROM parent_student_assignments WHERE parent_user_id = auth.uid())));

-- RLS for student_payments
CREATE POLICY "Admins can manage student payments" ON public.student_payments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view own payments" ON public.student_payments FOR SELECT TO authenticated
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Parents can view children payments" ON public.student_payments FOR SELECT TO authenticated
  USING (student_id IN (SELECT student_id FROM parent_student_assignments WHERE parent_user_id = auth.uid()));

-- Function to generate a bill for a student based on their department's fee rates
CREATE OR REPLACE FUNCTION public.generate_student_bill(p_student_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_dept_id uuid;
  v_year_id uuid;
  v_bill_id uuid;
  v_reg_total numeric := 0;
  v_tuition_total numeric := 0;
  v_grand_total numeric := 0;
BEGIN
  -- Get student's department
  SELECT department_id INTO v_dept_id FROM students WHERE id = p_student_id;
  IF v_dept_id IS NULL THEN RETURN; END IF;

  -- Get current academic year
  SELECT id INTO v_year_id FROM academic_years WHERE is_current = true LIMIT 1;
  IF v_year_id IS NULL THEN RETURN; END IF;

  -- Check if bill already exists
  SELECT id INTO v_bill_id FROM student_bills WHERE student_id = p_student_id AND academic_year_id = v_year_id;
  IF v_bill_id IS NOT NULL THEN RETURN; END IF;

  -- Calculate registration total from division_fee_rates
  SELECT COALESCE(SUM(dfr.amount), 0) INTO v_reg_total
  FROM division_fee_rates dfr
  WHERE dfr.department_id = v_dept_id AND dfr.academic_year_id = v_year_id;

  -- Calculate tuition total from installment_plans
  SELECT COALESCE(SUM(ip.amount), 0) INTO v_tuition_total
  FROM installment_plans ip
  WHERE ip.department_id = v_dept_id AND ip.academic_year_id = v_year_id;

  v_grand_total := v_reg_total + v_tuition_total;

  -- Create the bill
  INSERT INTO student_bills (student_id, academic_year_id, registration_total, tuition_total, grand_total, balance)
  VALUES (p_student_id, v_year_id, v_reg_total, v_tuition_total, v_grand_total, v_grand_total)
  RETURNING id INTO v_bill_id;

  -- Insert registration line items
  INSERT INTO student_bill_items (bill_id, item_type, item_name, amount)
  SELECT v_bill_id, 'registration', fc.name, dfr.amount
  FROM division_fee_rates dfr
  JOIN fee_categories fc ON fc.id = dfr.fee_category_id
  WHERE dfr.department_id = v_dept_id AND dfr.academic_year_id = v_year_id AND dfr.amount > 0;

  -- Insert installment line items
  INSERT INTO student_bill_items (bill_id, item_type, item_name, amount)
  SELECT v_bill_id, 'installment', ip.label || ' (' || ip.period_label || ')', ip.amount
  FROM installment_plans ip
  WHERE ip.department_id = v_dept_id AND ip.academic_year_id = v_year_id AND ip.amount > 0;
END;
$$;

-- Function to generate bills for ALL students in current academic year
CREATE OR REPLACE FUNCTION public.generate_all_student_bills()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer := 0;
  v_student record;
BEGIN
  FOR v_student IN SELECT id FROM students LOOP
    PERFORM generate_student_bill(v_student.id);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- Auto-generate receipt numbers
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
    NEW.receipt_number := 'RCP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_receipt_number
  BEFORE INSERT ON public.student_payments
  FOR EACH ROW EXECUTE FUNCTION generate_receipt_number();

-- Update bill balance when payment is made
CREATE OR REPLACE FUNCTION public.update_bill_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_paid numeric;
  v_grand_total numeric;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM student_payments WHERE bill_id = NEW.bill_id;

  SELECT grand_total INTO v_grand_total
  FROM student_bills WHERE id = NEW.bill_id;

  UPDATE student_bills
  SET amount_paid = v_total_paid,
      balance = v_grand_total - v_total_paid,
      status = CASE
        WHEN v_total_paid >= v_grand_total THEN 'paid'
        WHEN v_total_paid > 0 THEN 'partial'
        ELSE 'pending'
      END,
      updated_at = now()
  WHERE id = NEW.bill_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_bill_on_payment
  AFTER INSERT ON public.student_payments
  FOR EACH ROW EXECUTE FUNCTION update_bill_on_payment();
