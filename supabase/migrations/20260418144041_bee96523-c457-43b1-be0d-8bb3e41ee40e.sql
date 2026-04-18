-- Auto-seed a single "Total Points" assessment type for any Kindergarten department,
-- and prevent additional assessment types from being created under Kindergarten.

-- 1) Seed for existing Kindergarten departments missing one
INSERT INTO public.assessment_types (department_id, school_id, name, max_points, display_order)
SELECT d.id, d.school_id, 'Total Points', 100, 0
FROM public.departments d
WHERE lower(d.name) = 'kindergarten'
  AND NOT EXISTS (
    SELECT 1 FROM public.assessment_types at WHERE at.department_id = d.id
  );

-- 2) Trigger to auto-create the single assessment when a Kindergarten department is added
CREATE OR REPLACE FUNCTION public.kg_seed_total_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.name) = 'kindergarten' THEN
    INSERT INTO public.assessment_types (department_id, school_id, name, max_points, display_order)
    VALUES (NEW.id, NEW.school_id, 'Total Points', 100, 0)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kg_seed_total_points ON public.departments;
CREATE TRIGGER trg_kg_seed_total_points
AFTER INSERT ON public.departments
FOR EACH ROW EXECUTE FUNCTION public.kg_seed_total_points();

-- 3) Trigger to block extra assessment types on Kindergarten departments
CREATE OR REPLACE FUNCTION public.kg_block_extra_assessments()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  is_kg boolean;
BEGIN
  SELECT lower(name) = 'kindergarten' INTO is_kg
  FROM public.departments WHERE id = NEW.department_id;

  IF is_kg THEN
    IF EXISTS (
      SELECT 1 FROM public.assessment_types
      WHERE department_id = NEW.department_id
        AND (TG_OP = 'INSERT' OR id <> NEW.id)
    ) THEN
      RAISE EXCEPTION 'Kindergarten departments only allow a single "Total Points" assessment type.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kg_block_extra_assessments ON public.assessment_types;
CREATE TRIGGER trg_kg_block_extra_assessments
BEFORE INSERT OR UPDATE ON public.assessment_types
FOR EACH ROW EXECUTE FUNCTION public.kg_block_extra_assessments();