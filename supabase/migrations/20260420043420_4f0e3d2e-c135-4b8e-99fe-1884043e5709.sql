ALTER TABLE public.report_card_settings
  ADD COLUMN IF NOT EXISTS seal_url text,
  ADD COLUMN IF NOT EXISTS admin_signature_url text,
  ADD COLUMN IF NOT EXISTS administrator_role_label text NOT NULL DEFAULT 'Administrator',
  ADD COLUMN IF NOT EXISTS administrator_subtitle text,
  ADD COLUMN IF NOT EXISTS class_teacher_role_label text NOT NULL DEFAULT 'Class Teacher',
  ADD COLUMN IF NOT EXISTS class_teacher_subtitle text;