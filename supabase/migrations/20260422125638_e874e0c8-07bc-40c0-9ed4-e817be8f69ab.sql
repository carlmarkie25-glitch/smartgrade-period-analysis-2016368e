ALTER TABLE public.student_report_inputs
ADD COLUMN IF NOT EXISTS academic_year_id uuid;

UPDATE public.student_report_inputs sri
SET academic_year_id = c.academic_year_id
FROM public.students s
JOIN public.classes c ON c.id = s.class_id
WHERE sri.student_id = s.id
  AND sri.academic_year_id IS NULL;

UPDATE public.student_report_inputs
SET academic_year_id = (
  SELECT ay.id
  FROM public.academic_years ay
  WHERE ay.is_current = true
  ORDER BY ay.start_date DESC
  LIMIT 1
)
WHERE academic_year_id IS NULL;

ALTER TABLE public.student_report_inputs
ALTER COLUMN academic_year_id SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'student_report_inputs_student_id_period_key'
      AND conrelid = 'public.student_report_inputs'::regclass
  ) THEN
    ALTER TABLE public.student_report_inputs
    DROP CONSTRAINT student_report_inputs_student_id_period_key;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'student_report_inputs_student_id_period_academic_year_id_key'
      AND conrelid = 'public.student_report_inputs'::regclass
  ) THEN
    ALTER TABLE public.student_report_inputs
    ADD CONSTRAINT student_report_inputs_student_id_period_academic_year_id_key
    UNIQUE (student_id, period, academic_year_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_student_report_inputs_student_period_year
ON public.student_report_inputs (student_id, period, academic_year_id);