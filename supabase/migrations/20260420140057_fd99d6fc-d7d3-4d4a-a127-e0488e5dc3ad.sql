ALTER TABLE public.report_card_settings
  ADD COLUMN IF NOT EXISTS header_chip_color text NOT NULL DEFAULT '#c8a84b';

ALTER TABLE public.department_report_colors
  ADD COLUMN IF NOT EXISTS header_chip_color text;