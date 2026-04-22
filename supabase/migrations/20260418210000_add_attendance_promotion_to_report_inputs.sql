ALTER TABLE public.student_report_inputs
  ADD COLUMN IF NOT EXISTS days_present TEXT,
  ADD COLUMN IF NOT EXISTS days_absent TEXT,
  ADD COLUMN IF NOT EXISTS promotion_status TEXT;
