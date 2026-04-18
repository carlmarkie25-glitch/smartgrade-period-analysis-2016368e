-- Enable pg_cron + pg_net for scheduled jobs
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Storage bucket for Transfer Packs (public read so receiving schools without accounts can download via share link)
insert into storage.buckets (id, name, public)
values ('transfer-packs', 'transfer-packs', true)
on conflict (id) do nothing;

-- Anyone with the URL can read (public bucket); only admins can write/delete via edge function (service role bypasses)
create policy "Public can read transfer packs"
on storage.objects for select
using (bucket_id = 'transfer-packs');

create policy "Admins can manage transfer packs"
on storage.objects for all
to authenticated
using (bucket_id = 'transfer-packs' and has_role(auth.uid(), 'admin'::app_role))
with check (bucket_id = 'transfer-packs' and has_role(auth.uid(), 'admin'::app_role));