CREATE OR REPLACE FUNCTION public.generate_student_bill(p_student_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_dept_id uuid;
  v_year_id uuid;
  v_bill_id uuid;
  v_reg_total numeric := 0;
  v_tuition_total numeric := 0;
  v_grand_total numeric := 0;
BEGIN
  SELECT department_id INTO v_dept_id FROM students WHERE id = p_student_id;
  IF v_dept_id IS NULL THEN RETURN; END IF;

  -- Try current year first, then fall back to most recent year
  SELECT id INTO v_year_id FROM academic_years WHERE is_current = true LIMIT 1;
  IF v_year_id IS NULL THEN
    SELECT id INTO v_year_id FROM academic_years ORDER BY start_date DESC LIMIT 1;
  END IF;
  IF v_year_id IS NULL THEN RETURN; END IF;

  -- Check if bill already exists
  SELECT id INTO v_bill_id FROM student_bills WHERE student_id = p_student_id AND academic_year_id = v_year_id;
  IF v_bill_id IS NOT NULL THEN RETURN; END IF;

  SELECT COALESCE(SUM(dfr.amount), 0) INTO v_reg_total
  FROM division_fee_rates dfr
  WHERE dfr.department_id = v_dept_id AND dfr.academic_year_id = v_year_id;

  SELECT COALESCE(SUM(ip.amount), 0) INTO v_tuition_total
  FROM installment_plans ip
  WHERE ip.department_id = v_dept_id AND ip.academic_year_id = v_year_id;

  v_grand_total := v_reg_total + v_tuition_total;

  INSERT INTO student_bills (student_id, academic_year_id, registration_total, tuition_total, grand_total, balance)
  VALUES (p_student_id, v_year_id, v_reg_total, v_tuition_total, v_grand_total, v_grand_total)
  RETURNING id INTO v_bill_id;

  INSERT INTO student_bill_items (bill_id, item_type, item_name, amount)
  SELECT v_bill_id, 'registration', fc.name, dfr.amount
  FROM division_fee_rates dfr
  JOIN fee_categories fc ON fc.id = dfr.fee_category_id
  WHERE dfr.department_id = v_dept_id AND dfr.academic_year_id = v_year_id AND dfr.amount > 0;

  INSERT INTO student_bill_items (bill_id, item_type, item_name, amount)
  SELECT v_bill_id, 'installment', ip.label || ' (' || ip.period_label || ')', ip.amount
  FROM installment_plans ip
  WHERE ip.department_id = v_dept_id AND ip.academic_year_id = v_year_id AND ip.amount > 0;
END;
$function$;