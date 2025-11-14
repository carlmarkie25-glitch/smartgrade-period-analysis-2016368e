
-- Function to calculate and update period totals with ranks
CREATE OR REPLACE FUNCTION calculate_period_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id UUID;
  v_period TEXT;
  v_class_subject_id UUID;
  v_class_id UUID;
  v_total_score NUMERIC;
  v_rank INTEGER;
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

  -- Calculate ranks for all students in this class, period, and subject
  WITH ranked_students AS (
    SELECT 
      spt.id,
      RANK() OVER (ORDER BY spt.total_score DESC) as new_rank
    FROM student_period_totals spt
    JOIN students s ON s.id = spt.student_id
    WHERE s.class_id = v_class_id
      AND spt.period = v_period
      AND spt.class_subject_id = v_class_subject_id
  )
  UPDATE student_period_totals spt
  SET class_rank = rs.new_rank
  FROM ranked_students rs
  WHERE spt.id = rs.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on student_grades
DROP TRIGGER IF EXISTS trigger_calculate_period_totals ON student_grades;
CREATE TRIGGER trigger_calculate_period_totals
AFTER INSERT OR UPDATE OR DELETE ON student_grades
FOR EACH ROW
EXECUTE FUNCTION calculate_period_totals();

-- Add unique constraint to prevent duplicate period totals
ALTER TABLE student_period_totals
DROP CONSTRAINT IF EXISTS student_period_totals_unique;

ALTER TABLE student_period_totals
ADD CONSTRAINT student_period_totals_unique 
UNIQUE (student_id, class_subject_id, period);

-- Populate existing data
INSERT INTO student_period_totals (student_id, class_subject_id, period, total_score)
SELECT 
  student_id,
  class_subject_id,
  period,
  SUM(score) as total_score
FROM student_grades
GROUP BY student_id, class_subject_id, period
ON CONFLICT (student_id, class_subject_id, period)
DO UPDATE SET 
  total_score = EXCLUDED.total_score,
  updated_at = now();

-- Update ranks for all existing data
WITH ranked_students AS (
  SELECT 
    spt.id,
    RANK() OVER (
      PARTITION BY s.class_id, spt.period, spt.class_subject_id 
      ORDER BY spt.total_score DESC
    ) as new_rank
  FROM student_period_totals spt
  JOIN students s ON s.id = spt.student_id
)
UPDATE student_period_totals spt
SET class_rank = rs.new_rank
FROM ranked_students rs
WHERE spt.id = rs.id;
