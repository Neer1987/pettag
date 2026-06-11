-- Pet media storage (public read for QR visitor profiles)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pet-media',
  'pet-media',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "pet_media_public_read" on storage.objects;
create policy "pet_media_public_read"
  on storage.objects for select
  using (bucket_id = 'pet-media');

drop policy if exists "pet_media_anon_insert" on storage.objects;
create policy "pet_media_anon_insert"
  on storage.objects for insert
  with check (bucket_id = 'pet-media');

drop policy if exists "pet_media_anon_update" on storage.objects;
create policy "pet_media_anon_update"
  on storage.objects for update
  using (bucket_id = 'pet-media');

drop policy if exists "pet_media_anon_delete" on storage.objects;
create policy "pet_media_anon_delete"
  on storage.objects for delete
  using (bucket_id = 'pet-media');
