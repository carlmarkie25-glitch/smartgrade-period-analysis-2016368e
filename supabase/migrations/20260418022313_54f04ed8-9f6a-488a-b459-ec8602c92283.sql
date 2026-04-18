INSERT INTO storage.buckets (id, name, public)
VALUES ('school-assets', 'school-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read school assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'school-assets');

CREATE POLICY "Admins upload own school assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'school-assets'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
  AND (storage.foldername(name))[1] = public.current_school_id()::text
);

CREATE POLICY "Admins update own school assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'school-assets'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
  AND (storage.foldername(name))[1] = public.current_school_id()::text
);

CREATE POLICY "Admins delete own school assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'school-assets'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
  AND (storage.foldername(name))[1] = public.current_school_id()::text
);