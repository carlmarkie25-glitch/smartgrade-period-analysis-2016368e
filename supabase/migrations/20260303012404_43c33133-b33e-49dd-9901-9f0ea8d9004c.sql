-- Make student-photos bucket public so photos can be displayed
UPDATE storage.buckets SET public = true WHERE id = 'student-photos';
