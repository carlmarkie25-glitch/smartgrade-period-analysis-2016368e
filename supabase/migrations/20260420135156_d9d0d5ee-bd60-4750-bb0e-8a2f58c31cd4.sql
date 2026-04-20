ALTER TABLE public.report_card_settings
  ADD COLUMN IF NOT EXISTS general_average_text_color text NOT NULL DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS header_meta_text_color text NOT NULL DEFAULT '#c8a84b';

ALTER TABLE public.department_report_colors
  ADD COLUMN IF NOT EXISTS general_average_text_color text,
  ADD COLUMN IF NOT EXISTS header_meta_text_color text;