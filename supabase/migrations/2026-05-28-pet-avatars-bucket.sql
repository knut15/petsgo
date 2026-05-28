-- Public-read bucket for pet avatars.
-- Object path convention: {userId}/avatar.{ext}
-- First path segment must equal auth.uid() for owner-only writes.

insert into storage.buckets (id, name, public)
values ('pet-avatars', 'pet-avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "pet_avatars_read_all" on storage.objects;
create policy "pet_avatars_read_all"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'pet-avatars');

drop policy if exists "pet_avatars_insert_self" on storage.objects;
create policy "pet_avatars_insert_self"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'pet-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "pet_avatars_update_self" on storage.objects;
create policy "pet_avatars_update_self"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'pet-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "pet_avatars_delete_self" on storage.objects;
create policy "pet_avatars_delete_self"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'pet-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
