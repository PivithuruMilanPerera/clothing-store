-- Run this in the Supabase SQL editor if category image uploads fail with:
-- "Could not find the 'image_url' column of 'categories' in the schema cache"

alter table public.categories
  add column if not exists image_url text;
