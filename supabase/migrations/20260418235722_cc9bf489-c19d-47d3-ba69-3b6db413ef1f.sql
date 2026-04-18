-- Generic trigger function: if school_id is NULL on insert, fill it from current_school_id()
CREATE OR REPLACE FUNCTION public.set_school_id_from_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.school_id IS NULL THEN
    NEW.school_id := public.current_school_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Attach to all school-scoped tables
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'departments','classes','subjects','class_subjects','academic_years',
    'academic_periods','academic_events','assessment_types','class_schedules',
    'fee_categories','fee_structures','division_fee_rates','installment_plans',
    'students','student_grades','student_period_totals','student_yearly_totals',
    'student_report_inputs','student_bills','student_bill_items','student_payments',
    'student_data_exports','attendance_sessions','attendance_records',
    'sponsor_class_assignments','parent_student_assignments','expenses',
    'notifications','audit_logs','fee_assignments','payments','schedules'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_school_id ON public.%I;', t);
    EXECUTE format(
      'CREATE TRIGGER trg_set_school_id BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_school_id_from_user();',
      t
    );
  END LOOP;
END$$;