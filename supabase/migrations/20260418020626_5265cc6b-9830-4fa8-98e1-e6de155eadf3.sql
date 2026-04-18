
-- 1) Schools table
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  primary_color TEXT DEFAULT '#0d9488',
  country TEXT,
  subscription_plan TEXT NOT NULL DEFAULT 'starter',
  subscription_status TEXT NOT NULL DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '14 days'),
  max_students INTEGER NOT NULL DEFAULT 100,
  owner_user_id UUID,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER schools_updated_at
BEFORE UPDATE ON public.schools
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2) Default school + remember its id
DO $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.schools (name, slug, subscription_plan, subscription_status, trial_ends_at, max_students)
  VALUES ('Default School', 'default', 'premium', 'active', NULL, 100000)
  RETURNING id INTO v_id;

  INSERT INTO public.system_settings (setting_key, setting_value, description)
  VALUES ('default_school_id', v_id::text, 'ID of the default tenant for backfilled data');
END $$;

-- 3) user_schools mapping
CREATE TABLE IF NOT EXISTS public.user_schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, school_id)
);

ALTER TABLE public.user_schools ENABLE ROW LEVEL SECURITY;

INSERT INTO public.user_schools (user_id, school_id, is_primary)
SELECT DISTINCT p.user_id, (SELECT setting_value::uuid FROM public.system_settings WHERE setting_key = 'default_school_id'), true
FROM public.profiles p
ON CONFLICT DO NOTHING;

-- 4) Helper functions
CREATE OR REPLACE FUNCTION public.current_school_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT school_id FROM public.user_schools
  WHERE user_id = auth.uid() AND is_primary = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin');
$$;

-- 5) Add school_id everywhere & backfill
DO $$
DECLARE
  v_default UUID := (SELECT setting_value::uuid FROM public.system_settings WHERE setting_key = 'default_school_id');
  t TEXT;
  tbls TEXT[] := ARRAY[
    'profiles','students','classes','departments','subjects','academic_years','academic_periods',
    'academic_events','assessment_types','class_subjects','class_schedules','schedules',
    'student_grades','student_period_totals','student_yearly_totals','student_report_inputs',
    'fee_categories','fee_structures','fee_assignments','division_fee_rates','installment_plans',
    'student_bills','student_bill_items','student_payments','payments','expenses',
    'notifications','parent_student_assignments','sponsor_class_assignments'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE', t);
    EXECUTE format('UPDATE public.%I SET school_id = %L WHERE school_id IS NULL', t, v_default);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_school_id ON public.%I(school_id)', t, t);
  END LOOP;
END $$;

-- 6) RLS on schools
CREATE POLICY "View own school" ON public.schools FOR SELECT
USING (id = public.current_school_id() OR public.is_super_admin());

CREATE POLICY "Admin updates own school" ON public.schools FOR UPDATE
USING ((id = public.current_school_id() AND has_role(auth.uid(), 'admin')) OR public.is_super_admin())
WITH CHECK ((id = public.current_school_id() AND has_role(auth.uid(), 'admin')) OR public.is_super_admin());

CREATE POLICY "Super admin manages schools" ON public.schools FOR ALL
USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "Authenticated can create school on signup" ON public.schools FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 7) RLS on user_schools
CREATE POLICY "View own memberships" ON public.user_schools FOR SELECT
USING (user_id = auth.uid() OR public.is_super_admin()
       OR (school_id = public.current_school_id() AND has_role(auth.uid(), 'admin')));

CREATE POLICY "Admins manage memberships" ON public.user_schools FOR ALL
USING ((school_id = public.current_school_id() AND has_role(auth.uid(), 'admin')) OR public.is_super_admin())
WITH CHECK ((school_id = public.current_school_id() AND has_role(auth.uid(), 'admin')) OR public.is_super_admin());

CREATE POLICY "Insert own membership on signup" ON public.user_schools FOR INSERT
WITH CHECK (user_id = auth.uid());
