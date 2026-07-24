-- 1) Product price (required by admin product form)
alter table public.products
  add column if not exists price numeric(10, 2);

alter table public.products
  add column if not exists base_price numeric(10, 2);

alter table public.products
  add column if not exists discount_type text;

alter table public.products
  add column if not exists discount_value numeric(10, 2);

update public.products
set price = 0
where price is null;

update public.products
set base_price = price
where base_price is null;

update public.products
set discount_value = 0
where discount_value is null;

alter table public.products
  alter column price set default 0;

alter table public.products
  alter column price set not null;

alter table public.products
  alter column base_price set default 0;

alter table public.products
  alter column base_price set not null;

alter table public.products
  alter column discount_value set default 0;

alter table public.products
  alter column discount_value set not null;

alter table public.products
  drop constraint if exists products_price_check;

alter table public.products
  add constraint products_price_check check (price >= 0);

alter table public.products
  drop constraint if exists products_base_price_check;

alter table public.products
  add constraint products_base_price_check check (base_price >= 0);

alter table public.products
  drop constraint if exists products_discount_value_check;

alter table public.products
  add constraint products_discount_value_check check (discount_value >= 0);

alter table public.products
  drop constraint if exists products_discount_type_check;

alter table public.products
  add constraint products_discount_type_check
  check (discount_type is null or discount_type in ('percentage', 'fixed'));

-- 1b) Legacy products.category column (old enum); app now uses category_id
alter table public.products
  drop constraint if exists products_category_check;

update public.products p
set category = c.slug
from public.categories c
where p.category_id = c.id
  and (p.category is null or p.category = '');

alter table public.products
  alter column category drop not null;

-- 1c) Legacy products.image column (single image); app now uses product_images
update public.products p
set image = pi.url
from (
  select distinct on (product_id) product_id, url
  from public.product_images
  order by product_id, sort_order asc
) pi
where p.id = pi.product_id
  and (p.image is null or p.image = '');

alter table public.products
  alter column image drop not null;

-- 2) Product images: align legacy "src" column with app "url"
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_images'
      and column_name = 'src'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_images'
      and column_name = 'url'
  ) then
    alter table public.product_images rename column src to url;
  end if;
end;
$$;

alter table public.product_images
  add column if not exists url text;

update public.product_images
set url = coalesce(url, '')
where url is null;

-- 3) Per-product colors (replaces legacy global colors for admin CRUD)
create table if not exists public.product_colors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  hex text not null default '#000000',
  sort_order integer not null default 0
);

create index if not exists product_colors_product_id_idx
  on public.product_colors (product_id);

alter table public.product_colors enable row level security;

drop policy if exists "Anyone can view product colors" on public.product_colors;
create policy "Anyone can view product colors"
  on public.product_colors for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_published = true
    )
  );

drop policy if exists "Admins can manage product colors" on public.product_colors;
create policy "Admins can manage product colors"
  on public.product_colors for all
  using (public.is_admin())
  with check (public.is_admin());

-- 4) Per-product sizes (replaces legacy global sizes for admin CRUD)
create table if not exists public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  label text not null,
  sort_order integer not null default 0
);

create index if not exists product_sizes_product_id_idx
  on public.product_sizes (product_id);

alter table public.product_sizes enable row level security;

drop policy if exists "Anyone can view product sizes" on public.product_sizes;
create policy "Anyone can view product sizes"
  on public.product_sizes for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_published = true
    )
  );

drop policy if exists "Admins can manage product sizes" on public.product_sizes;
create policy "Admins can manage product sizes"
  on public.product_sizes for all
  using (public.is_admin())
  with check (public.is_admin());

-- 5) Product inventory stock quantity
alter table public.products
  add column if not exists inventory integer;

update public.products
set inventory = 100
where inventory is null;

alter table public.products
  alter column inventory set default 0;

alter table public.products
  alter column inventory set not null;

alter table public.products
  drop constraint if exists products_inventory_check;

alter table public.products
  add constraint products_inventory_check check (inventory >= 0);

-- 6) Link product images to color variants
alter table public.product_images
  add column if not exists color_name text;
