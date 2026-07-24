-- Allow product variants with only a color or only a size.
-- Run in the Supabase SQL editor after product-variants-migration.sql.

alter table public.product_variants
  alter column color_id drop not null,
  alter column size_id drop not null;

alter table public.product_variants
  drop constraint if exists product_variants_color_or_size_check;

alter table public.product_variants
  add constraint product_variants_color_or_size_check
  check (color_id is not null or size_id is not null);

drop index if exists product_variants_product_color_size_idx;

create unique index if not exists product_variants_product_color_size_idx
  on public.product_variants (product_id, color_id, size_id)
  where color_id is not null and size_id is not null;

create unique index if not exists product_variants_product_color_only_idx
  on public.product_variants (product_id, color_id)
  where color_id is not null and size_id is null;

create unique index if not exists product_variants_product_size_only_idx
  on public.product_variants (product_id, size_id)
  where color_id is null and size_id is not null;
