ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

-- Seed sensible defaults for existing departments based on common Liberian school names
UPDATE public.departments SET display_order = CASE
  WHEN lower(name) ~ '(nursery|pre-?k|pre-?school|abc|creche|day ?care)' THEN 10
  WHEN lower(name) ~ '(kindergarten|kg)' THEN 20
  WHEN lower(name) ~ '(elementary|primary)' THEN 30
  WHEN lower(name) ~ '(junior|jhs|middle)' THEN 40
  WHEN lower(name) ~ '(senior|shs|high school|secondary)' THEN 50
  ELSE 60
END
WHERE display_order = 0;

-- Seed display_order for classes by extracting any number found in the name
UPDATE public.classes SET display_order = COALESCE(
  NULLIF(regexp_replace(name, '[^0-9]', '', 'g'), '')::int,
  0
)
WHERE display_order = 0;

CREATE INDEX IF NOT EXISTS idx_departments_display_order ON public.departments(school_id, display_order);
CREATE INDEX IF NOT EXISTS idx_classes_display_order ON public.classes(department_id, display_order);