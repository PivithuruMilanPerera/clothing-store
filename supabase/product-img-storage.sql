-- Run this in the Supabase SQL editor after admins.sql
-- Creates a public bucket for product images.

insert into storage.buckets (id, name, public)
values ('product-img', 'product-img', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Public read access for product images" on storage.objects;
drop policy if exists "Admins can upload product images" on storage.objects;
drop policy if exists "Admins can update product images" on storage.objects;
drop policy if exists "Admins can delete product images" on storage.objects;

create policy "Public read access for product images"
  on storage.objects
  for select
  using (bucket_id = 'product-img');

create policy "Admins can upload product images"
  on storage.objects
  for insert
  with check (bucket_id = 'product-img' and public.is_admin());

create policy "Admins can update product images"
  on storage.objects
  for update
  using (bucket_id = 'product-img' and public.is_admin());

create policy "Admins can delete product images"
  on storage.objects
  for delete
  using (bucket_id = 'product-img' and public.is_admin());
