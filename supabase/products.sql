-- Run in Supabase SQL editor after categories.sql

-- Category images
alter table public.categories
  add column if not exists image_url text;

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null,
  slug text not null unique,
  brand text not null default 'VELVORZ',
  price numeric(10, 2) not null check (price >= 0),
  base_price numeric(10, 2) not null check (base_price >= 0),
  discount_type text check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10, 2) not null default 0 check (discount_value >= 0),
  description text not null default '',
  materials_care text not null default '',
  shipping_returns text not null default '',
  badge text,
  inventory integer not null default 0 check (inventory >= 0),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_slug_idx on public.products (slug);
create index if not exists products_created_at_idx on public.products (created_at desc);

create table if not exists public.colors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hex text not null default '#000000',
  created_at timestamptz not null default now()
);

create unique index if not exists colors_name_hex_idx
  on public.colors (lower(trim(name)), lower(trim(hex)));

create table if not exists public.sizes (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists sizes_label_idx
  on public.sizes (upper(trim(label)));

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists brands_name_idx
  on public.brands (lower(trim(name)));

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  alt text not null default '',
  color_id uuid references public.colors (id) on delete set null,
  sort_order integer not null default 0
);

create index if not exists product_images_product_id_idx on public.product_images (product_id);

create table if not exists public.product_colors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  color_id uuid not null references public.colors (id) on delete restrict,
  sort_order integer not null default 0
);

create unique index if not exists product_colors_product_color_idx
  on public.product_colors (product_id, color_id);
create index if not exists product_colors_product_id_idx on public.product_colors (product_id);

create table if not exists public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  size_id uuid not null references public.sizes (id) on delete restrict,
  sort_order integer not null default 0
);

create unique index if not exists product_sizes_product_size_idx
  on public.product_sizes (product_id, size_id);
create index if not exists product_sizes_product_id_idx on public.product_sizes (product_id);

create or replace function public.set_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_products_updated_at();

alter table public.products enable row level security;
alter table public.colors enable row level security;
alter table public.sizes enable row level security;
alter table public.brands enable row level security;
alter table public.product_images enable row level security;
alter table public.product_colors enable row level security;
alter table public.product_sizes enable row level security;

drop policy if exists "Anyone can view published products" on public.products;
create policy "Anyone can view published products"
  on public.products for select using (is_published = true);

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Anyone can view colors" on public.colors;
create policy "Anyone can view colors"
  on public.colors for select
  using (true);

drop policy if exists "Admins can manage colors" on public.colors;
create policy "Admins can manage colors"
  on public.colors for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Anyone can view sizes" on public.sizes;
create policy "Anyone can view sizes"
  on public.sizes for select
  using (true);

drop policy if exists "Admins can manage sizes" on public.sizes;
create policy "Admins can manage sizes"
  on public.sizes for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Anyone can view brands" on public.brands;
create policy "Anyone can view brands"
  on public.brands for select
  using (true);

drop policy if exists "Admins can manage brands" on public.brands;
create policy "Admins can manage brands"
  on public.brands for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Anyone can view product images" on public.product_images;
create policy "Anyone can view product images"
  on public.product_images for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_published = true
    )
  );

drop policy if exists "Admins can manage product images" on public.product_images;
create policy "Admins can manage product images"
  on public.product_images for all
  using (public.is_admin())
  with check (public.is_admin());

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
