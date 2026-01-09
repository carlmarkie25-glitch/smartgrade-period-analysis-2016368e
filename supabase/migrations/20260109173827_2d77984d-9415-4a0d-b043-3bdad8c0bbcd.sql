-- 1) Allow saving empty grades as NULL (used for "Incomplete")
ALTER TABLE public.student_grades
  ALTER COLUMN score DROP NOT NULL,
  ALTER COLUMN score DROP DEFAULT;

-- 2) Ensure we only have ONE calculate_period_totals trigger (avoid double execution)
DROP TRIGGER IF EXISTS trg_calculate_period_totals ON public.student_grades;
DROP TRIGGER IF EXISTS trigger_calculate_period_totals ON public.student_grades;

CREATE TRIGGER trg_calculate_period_totals
AFTER INSERT OR UPDATE OR DELETE ON public.student_grades
FOR EACH ROW
EXECUTE FUNCTION public.calculate_period_totals();

-- 3) Provide a single RPC to get correct class rank per period (overall across all subjects)
--    This fixes ranks appearing to follow "time added" due to picking a random subject total.
CREATE OR REPLACE FUNCTION public.get_student_period_ranks(
  p_student_id uuid,
  p_periods public.period_type[]
)
RETURNS TABLE(
  period public.period_type,
  class_rank integer,
  total_students integer,
  is_incomplete boolean,
  total_score numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
WITH
  caller AS (
    SELECT auth.uid() AS uid
  ),
  student_row AS (
    SELECT id, class_id, user_id, department_id
    FROM public.students
    WHERE id = p_student_id
  ),
  allowed AS (
    SELECT
      CASE
        WHEN sr.id IS NULL THEN false
        WHEN has_role(c.uid, 'admin'::public.app_role) THEN true
        WHEN has_role(c.uid, 'teacher'::public.app_role)
          AND EXISTS (
            SELECT 1
            FROM public.classes cl
            WHERE cl.id = sr.class_id
              AND cl.teacher_id = c.uid
          ) THEN true
        WHEN sr.user_id = c.uid THEN true
        ELSE false
      END AS ok
    FROM caller c
    CROSS JOIN student_row sr
  ),
  periods AS (
    SELECT unnest(p_periods) AS period
  ),
  expected AS (
    SELECT
      COUNT(*)::int AS expected_count,
      COALESCE(SUM(at.max_points), 0)::numeric AS expected_max
    FROM public.assessment_types at
    CROSS JOIN student_row sr
    WHERE at.department_id IS NULL
       OR at.department_id = sr.department_id
  ),
  students_in_class AS (
    SELECT s.id AS student_id
    FROM public.students s
    JOIN student_row sr ON sr.class_id = s.class_id
  ),
  class_subjects_in_class AS (
    SELECT cs.id AS class_subject_id
    FROM public.class_subjects cs
    JOIN student_row sr ON sr.class_id = cs.class_id
  ),
  per_student_subject_period AS (
    SELECT
      sic.student_id,
      csc.class_subject_id,
      p.period,
      COALESCE(SUM(sg.score), 0)::numeric AS subject_score,
      COALESCE(SUM(sg.max_score), 0)::numeric AS subject_max,
      COUNT(sg.id)::int AS grade_count,
      e.expected_count,
      e.expected_max
    FROM students_in_class sic
    CROSS JOIN class_subjects_in_class csc
    CROSS JOIN periods p
    CROSS JOIN expected e
    LEFT JOIN public.student_grades sg
      ON sg.student_id = sic.student_id
     AND sg.class_subject_id = csc.class_subject_id
     AND sg.period = p.period
    GROUP BY sic.student_id, csc.class_subject_id, p.period, e.expected_count, e.expected_max
  ),
  per_student_period AS (
    SELECT
      student_id,
      period,
      SUM(subject_score)::numeric AS total_score,
      BOOL_OR(
        grade_count < expected_count
        OR subject_max < expected_max
        OR subject_max <= 0
        OR (subject_score / NULLIF(subject_max, 0)) < 0.6
      ) AS is_incomplete
    FROM per_student_subject_period
    GROUP BY student_id, period
  ),
  ranked AS (
    SELECT
      psp.student_id,
      psp.period,
      psp.total_score,
      psp.is_incomplete,
      ROW_NUMBER() OVER (
        PARTITION BY psp.period
        ORDER BY psp.is_incomplete ASC, psp.total_score DESC, psp.student_id ASC
      ) AS class_rank
    FROM per_student_period psp
  ),
  totals AS (
    SELECT COUNT(*)::int AS total_students
    FROM students_in_class
  )
SELECT
  r.period,
  r.class_rank,
  t.total_students,
  r.is_incomplete,
  r.total_score
FROM ranked r
CROSS JOIN totals t
CROSS JOIN allowed a
WHERE a.ok
  AND r.student_id = p_student_id;
$$;