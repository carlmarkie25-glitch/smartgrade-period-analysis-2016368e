-- Create storage bucket for student photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-photos', 'student-photos', true);

-- Allow authenticated users to upload student photos
CREATE POLICY "Admins can upload student photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'student-photos' 
  AND has_role(auth.uid(), 'admin')
);

-- Allow public read access to student photos
CREATE POLICY "Anyone can view student photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'student-photos');

-- Allow admins to update student photos
CREATE POLICY "Admins can update student photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'student-photos' AND has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'student-photos' AND has_role(auth.uid(), 'admin'));

-- Allow admins to delete student photos
CREATE POLICY "Admins can delete student photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'student-photos' AND has_role(auth.uid(), 'admin'));