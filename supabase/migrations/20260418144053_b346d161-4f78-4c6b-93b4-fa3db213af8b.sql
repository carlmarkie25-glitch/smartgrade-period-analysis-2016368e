CREATE OR REPLACE FUNCTION public.kg_block_extra_assessments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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