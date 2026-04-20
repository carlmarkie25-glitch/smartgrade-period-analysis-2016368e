ALTER TABLE public.student_report_inputs
  ADD COLUMN IF NOT EXISTS promotion_status text,
  ADD COLUMN IF NOT EXISTS promotion_condition text;