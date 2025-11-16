-- Remove the type enum from departments table
ALTER TABLE public.departments DROP COLUMN type;

-- Add department_id to assessment_types to link assessments to departments
ALTER TABLE public.assessment_types ADD COLUMN department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_assessment_types_department_id ON public.assessment_types(department_id);