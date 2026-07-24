-- Run this only if you already ran the older products.sql with store_sizes.
-- It moves sizes onto each product (like colors).

drop table if exists public.product_sizes cascade;
drop table if exists public.store_sizes cascade;

create table public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  label text not null,
  sort_order integer not null default 0
);

create index product_sizes_product_id_idx on public.product_sizes (product_id);

alter table public.product_sizes enable row level security;

create policy "Anyone can view product sizes"
  on public.product_sizes for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_published = true
    )
  );

create policy "Admins can manage product sizes"
  on public.product_sizes for all
  using (public.is_admin())
  with check (public.is_admin());
