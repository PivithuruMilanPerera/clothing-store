-- Per-variant inventory (color + size) for each product.
-- Run in the Supabase SQL editor after colors-sizes-normalize-migration.sql.

create extension if not exists pgcrypto;

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  color_id uuid not null references public.colors (id) on delete restrict,
  size_id uuid not null references public.sizes (id) on delete restrict,
  inventory integer not null default 0 check (inventory >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_variants
  alter column id set default gen_random_uuid();

create unique index if not exists product_variants_product_color_size_idx
  on public.product_variants (product_id, color_id, size_id);

create index if not exists product_variants_product_id_idx
  on public.product_variants (product_id);

insert into public.product_variants (product_id, color_id, size_id, inventory)
select
  pc.product_id,
  pc.color_id,
  ps.size_id,
  case
    when count(*) over (partition by pc.product_id) = 1 then greatest(p.inventory, 0)
    else 0
  end
from public.product_colors pc
join public.product_sizes ps on ps.product_id = pc.product_id
join public.products p on p.id = pc.product_id
on conflict do nothing;

update public.products p
set inventory = coalesce(
  (
    select sum(pv.inventory)
    from public.product_variants pv
    where pv.product_id = p.id
  ),
  0
);

create or replace function public.set_product_variants_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists product_variants_set_updated_at on public.product_variants;
create trigger product_variants_set_updated_at
before update on public.product_variants
for each row execute function public.set_product_variants_updated_at();

alter table public.product_variants enable row level security;

drop policy if exists "Anyone can view product variants" on public.product_variants;
create policy "Anyone can view product variants"
  on public.product_variants for select
  using (
    exists (
      select 1
      from public.products p
      where p.id = product_id and p.is_published = true
    )
  );

drop policy if exists "Admins can manage product variants" on public.product_variants;
create policy "Admins can manage product variants"
  on public.product_variants for all
  using (public.is_admin())
  with check (public.is_admin());
