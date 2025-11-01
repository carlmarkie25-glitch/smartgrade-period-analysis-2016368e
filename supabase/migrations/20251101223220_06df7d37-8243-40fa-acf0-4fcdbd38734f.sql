-- Delete student grades associated with the combined assessment type
DELETE FROM student_grades 
WHERE assessment_type_id = '70fe918d-6e25-41a7-954f-c7ed88114b4e';

-- Delete the problematic assessment type
DELETE FROM assessment_types 
WHERE id = '70fe918d-6e25-41a7-954f-c7ed88114b4e';