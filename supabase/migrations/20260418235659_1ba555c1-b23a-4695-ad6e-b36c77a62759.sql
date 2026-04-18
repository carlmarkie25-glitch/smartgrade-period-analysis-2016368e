-- Helper: check if a user belongs to the school owning a row
-- (uses existing current_school_id() / is_super_admin() functions)

-- Generic pattern applied per table:
--   SELECT: school_id = current_school_id() OR is_super_admin()

-- ============ departments ============
DROP POLICY IF EXISTS "Anyone can view departments" ON public.departments;
CREATE POLICY "View departments in own school" ON public.departments
  FOR SELECT TO authenticated
  USING (school_id = current_school_id() OR is_super_admin());

-- ============ classes ============
DROP POLICY IF EXISTS "Anyone can view classes" ON public.classes;
CREATE POLICY "View classes in own school" ON public.classes
  FOR SELECT TO authenticated
  USING (school_id = current_school_id() OR is_super_admin());

-- ============ subjects ============
DROP POLICY IF EXISTS "Anyone can view subjects" ON public.subjects;
CREATE POLICY "View subjects in own school" ON public.subjects
  FOR SELECT TO authenticated
  USING (school_id = current_school_id() OR is_super_admin());

-- ============ class_subjects ============
DROP POLICY IF EXISTS "Anyone can view class subjects" ON public.class_subjects;
CREATE POLICY "View class_subjects in own school" ON public.class_subjects
  FOR SELECT TO authenticated
  USING (school_id = current_school_id() OR is_super_admin());

-- ============ academic_years ============
DROP POLICY IF EXISTS "Anyone can view academic years" ON public.academic_years;
CREATE POLICY "View academic_years in own school" ON public.academic_years
  FOR SELECT TO authenticated
  USING (school_id = current_school_id() OR is_super_admin());

-- ============ academic_periods ============
DROP POLICY IF EXISTS "Authenticated users can view academic periods" ON public.academic_periods;
CREATE POLICY "View academic_periods in own school" ON public.academic_periods
  FOR SELECT TO authenticated
  USING (school_id = current_school_id() OR is_super_admin());

-- ============ academic_events ============
DROP POLICY IF EXISTS "Authenticated users can view academic events" ON public.academic_events;
CREATE POLICY "View academic_events in own school" ON public.academic_events
  FOR SELECT TO authenticated
  USING (school_id = current_school_id() OR is_super_admin());

-- ============ assessment_types ============
DROP POLICY IF EXISTS "Anyone can view assessment types" ON public.assessment_types;
CREATE POLICY "View assessment_types in own school" ON public.assessment_types
  FOR SELECT TO authenticated
  USING (school_id = current_school_id() OR is_super_admin());

-- ============ class_schedules ============
DROP POLICY IF EXISTS "Authenticated users can view class schedules" ON public.class_schedules;
CREATE POLICY "View class_schedules in own school" ON public.class_schedules
  FOR SELECT TO authenticated
  USING (school_id = current_school_id() OR is_super_admin());

-- ============ fee_categories ============
DROP POLICY IF EXISTS "Authenticated can view fee categories" ON public.fee_categories;
CREATE POLICY "View fee_categories in own school" ON public.fee_categories
  FOR SELECT TO authenticated
  USING (school_id = current_school_id() OR is_super_admin());

-- ============ fee_structures ============
DROP POLICY IF EXISTS "Authenticated users can view fee structures" ON public.fee_structures;
CREATE POLICY "View fee_structures in own school" ON public.fee_structures
  FOR SELECT TO authenticated
  USING (school_id = current_school_id() OR is_super_admin());

-- ============ division_fee_rates ============
DROP POLICY IF EXISTS "Authenticated can view division fee rates" ON public.division_fee_rates;
CREATE POLICY "View division_fee_rates in own school" ON public.division_fee_rates
  FOR SELECT TO authenticated
  USING (school_id = current_school_id() OR is_super_admin());

-- ============ installment_plans ============
DROP POLICY IF EXISTS "Authenticated can view installment plans" ON public.installment_plans;
CREATE POLICY "View installment_plans in own school" ON public.installment_plans
  FOR SELECT TO authenticated
  USING (school_id = current_school_id() OR is_super_admin());

-- ============ profiles: prevent cross-school profile leaking ============
-- Existing policy: admins see all profiles. Restrict admins to their own school.
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins view profiles in own school" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR (has_role(auth.uid(), 'admin'::app_role) AND school_id = current_school_id())
  );

-- ============ students: ensure admin/teacher reads are school-scoped ============
-- (Existing teacher/student/parent policies already filter by relationship)
-- No change to base teacher/parent/student policies; just ensure no broad authenticated read exists.
DROP POLICY IF EXISTS "Anyone can view students" ON public.students;