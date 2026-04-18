-- Drop the broad SELECT policy that allowed listing
drop policy if exists "Public can read transfer packs" on storage.objects;

-- Public download via direct URL still works because the bucket is public,
-- but listing requires admin role
create policy "Admins can list transfer packs"
on storage.objects for select
to authenticated
using (bucket_id = 'transfer-packs' and has_role(auth.uid(), 'admin'::app_role));