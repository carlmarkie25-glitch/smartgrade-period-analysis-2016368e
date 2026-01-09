-- Ensure the trigger function returns the correct row type per operation
CREATE OR REPLACE FUNCTION public.calculate_period_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_student_id UUID;
  v_period public.period_type;
  v_class_subject_id UUID;
  v_class_id UUID;
  v_total_score NUMERIC;
BEGIN
  -- Get the affected student_id and period
  IF TG_OP = 'DELETE' THEN
    v_student_id := OLD.student_id;
    v_period := OLD.period;
    v_class_subject_id := OLD.class_subject_id;
  ELSE
    v_student_id := NEW.student_id;
    v_period := NEW.period;
    v_class_subject_id := NEW.class_subject_id;
  END IF;

  -- Get the class_id for this student
  SELECT class_id INTO v_class_id
  FROM students
  WHERE id = v_student_id;

  -- Calculate total score for this student in this period and class_subject
  SELECT COALESCE(SUM(score), 0) INTO v_total_score
  FROM student_grades
  WHERE student_id = v_student_id
    AND period = v_period
    AND class_subject_id = v_class_subject_id;

  -- Insert or update the period total
  INSERT INTO student_period_totals (student_id, class_subject_id, period, total_score)
  VALUES (v_student_id, v_class_subject_id, v_period, v_total_score)
  ON CONFLICT (student_id, class_subject_id, period)
  DO UPDATE SET
    total_score = EXCLUDED.total_score,
    updated_at = now();

  /*
    Ranking update:
    - A student is considered INCOMPLETE for ranking if:
        1) they are missing any assessment rows for this subject+period, OR
        2) their aggregate percentage (total_score / total_max * 100) is below 60.
    - Incomplete students are pushed to the bottom (worst ranks).
  */
  WITH expected AS (
    SELECT
      COUNT(*)::int AS expected_count,
      COALESCE(SUM(max_points), 0)::numeric AS expected_max
    FROM assessment_types
  ),
  ranked_students AS (
    SELECT
      spt.id,
      spt.student_id,
      spt.total_score,
      COALESCE(SUM(sg.max_score), 0)::numeric AS total_max,
      COUNT(sg.id)::int AS grade_count,
      (
        COUNT(sg.id) < e.expected_count
        OR COALESCE(SUM(sg.max_score), 0)::numeric < e.expected_max
        OR COALESCE(SUM(sg.max_score), 0)::numeric <= 0
        OR (spt.total_score / NULLIF(COALESCE(SUM(sg.max_score), 0)::numeric, 0)) < 0.6
      ) AS is_incomplete
    FROM student_period_totals spt
    JOIN students s ON s.id = spt.student_id
    CROSS JOIN expected e
    LEFT JOIN student_grades sg
      ON sg.student_id = spt.student_id
     AND sg.period = v_period
     AND sg.class_subject_id = v_class_subject_id
    WHERE s.class_id = v_class_id
      AND spt.period = v_period
      AND spt.class_subject_id = v_class_subject_id
    GROUP BY spt.id, spt.student_id, spt.total_score, e.expected_count, e.expected_max
  ),
  complete_count AS (
    SELECT COUNT(*)::int AS cnt
    FROM ranked_students
    WHERE NOT is_incomplete
  ),
  ordered AS (
    SELECT
      rs.id,
      CASE
        WHEN rs.is_incomplete THEN
          (SELECT cnt FROM complete_count)
          + ROW_NUMBER() OVER (PARTITION BY rs.is_incomplete ORDER BY rs.total_score DESC)
        ELSE
          RANK() OVER (PARTITION BY rs.is_incomplete ORDER BY rs.total_score DESC)
      END AS new_rank
    FROM ranked_students rs
  )
  UPDATE student_period_totals spt
  SET class_rank = o.new_rank,
      updated_at = now()
  FROM ordered o
  WHERE spt.id = o.id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;

-- Attach the trigger so ranks are recalculated whenever grades change
DROP TRIGGER IF EXISTS trg_calculate_period_totals ON public.student_grades;
CREATE TRIGGER trg_calculate_period_totals
AFTER INSERT OR UPDATE OR DELETE ON public.student_grades
FOR EACH ROW
EXECUTE FUNCTION public.calculate_period_totals();
