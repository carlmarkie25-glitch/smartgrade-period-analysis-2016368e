-- Add per-student tier fields to schools
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'basic',
  ADD COLUMN IF NOT EXISTS billable_student_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_billing_snapshot_at timestamptz,
  ADD COLUMN IF NOT EXISTS lockout_state text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS lockout_started_at timestamptz;

-- Constrain values
DO $$ BEGIN
  ALTER TABLE public.schools
    ADD CONSTRAINT schools_subscription_tier_check
    CHECK (subscription_tier IN ('basic','standard','premium'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.schools
    ADD CONSTRAINT schools_lockout_state_check
    CHECK (lockout_state IN ('none','past_due','locked','suspended'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Map existing plan labels to new tiers
UPDATE public.schools SET subscription_tier =
  CASE subscription_plan
    WHEN 'starter' THEN 'basic'
    WHEN 'pro' THEN 'standard'
    WHEN 'premium_plan' THEN 'premium'
    WHEN 'premium' THEN 'premium'
    ELSE 'basic'
  END
WHERE subscription_tier = 'basic';

-- Add is_active to students
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Backfill snapshot counts
UPDATE public.schools s
SET billable_student_count = (
  SELECT COUNT(*)::int FROM public.students st
  WHERE st.school_id = s.id AND st.is_active = true
)
WHERE billable_student_count = 0;

-- Helper: count active students for a school
CREATE OR REPLACE FUNCTION public.count_active_students(p_school_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.students
  WHERE school_id = p_school_id AND is_active = true;
$$;

-- Helper: get billable seat count with 50-seat minimum floor
CREATE OR REPLACE FUNCTION public.get_billable_seats(p_school_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(50, public.count_active_students(p_school_id));
$$;