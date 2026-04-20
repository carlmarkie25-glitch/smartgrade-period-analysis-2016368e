ALTER TABLE public.report_card_settings
  ADD COLUMN IF NOT EXISTS kg_a_plus_label text NOT NULL DEFAULT 'Outstanding',
  ADD COLUMN IF NOT EXISTS kg_a_label      text NOT NULL DEFAULT 'Excellent',
  ADD COLUMN IF NOT EXISTS kg_b_plus_label text NOT NULL DEFAULT 'Very Good',
  ADD COLUMN IF NOT EXISTS kg_b_label      text NOT NULL DEFAULT 'Good',
  ADD COLUMN IF NOT EXISTS kg_c_plus_label text NOT NULL DEFAULT 'Above Average',
  ADD COLUMN IF NOT EXISTS kg_c_label      text NOT NULL DEFAULT 'Average',
  ADD COLUMN IF NOT EXISTS kg_d_label      text NOT NULL DEFAULT 'Below Average',
  ADD COLUMN IF NOT EXISTS kg_f_label      text NOT NULL DEFAULT 'Failing';