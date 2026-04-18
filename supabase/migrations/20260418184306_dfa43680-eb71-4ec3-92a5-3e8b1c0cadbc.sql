-- Add per-class grading mode so admins can choose letters (KG-style) or numbers per class
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS grading_mode text NOT NULL DEFAULT 'numbers'
    CHECK (grading_mode IN ('numbers', 'letters'));

-- Backfill: any class currently under a 'kindergarten' department should default to letters
UPDATE public.classes c
SET grading_mode = 'letters'
FROM public.departments d
WHERE c.department_id = d.id
  AND lower(d.name) = 'kindergarten'
  AND c.grading_mode = 'numbers';