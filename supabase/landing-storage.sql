-- Run this in the Supabase SQL editor after admins.sql
-- Creates a public bucket for landing page banner and logo images.

insert into storage.buckets (id, name, public)
values ('landing', 'landing', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Public read access for landing images" on storage.objects;
drop policy if exists "Admins can upload landing images" on storage.objects;
drop policy if exists "Admins can update landing images" on storage.objects;
drop policy if exists "Admins can delete landing images" on storage.objects;

create policy "Public read access for landing images"
  on storage.objects
  for select
  using (bucket_id = 'landing');

create policy "Admins can upload landing images"
  on storage.objects
  for insert
  with check (bucket_id = 'landing' and public.is_admin());

create policy "Admins can update landing images"
  on storage.objects
  for update
  using (bucket_id = 'landing' and public.is_admin());

create policy "Admins can delete landing images"
  on storage.objects
  for delete
  using (bucket_id = 'landing' and public.is_admin());
