-- Normalize colors and sizes into master tables with product junction links.
-- Run in the Supabase SQL editor after products.sql.
-- Safe to re-run after a partial failure.

create extension if not exists pgcrypto;

-- Remove interim catalog tables from earlier attempts.
drop table if exists public.catalog_colors cascade;
drop table if exists public.catalog_sizes cascade;

-- Drop legacy master tables that do not match the expected schema.
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'colors'
  ) and (
    not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'colors'
        and column_name = 'hex'
    )
    or exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'colors'
        and column_name = 'sort_order'
    )
  ) then
    drop table public.colors cascade;
  end if;

  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'sizes'
  ) and (
    not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'sizes'
        and column_name = 'label'
    )
    or exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'sizes'
        and column_name = 'sort_order'
    )
  ) then
    drop table public.sizes cascade;
  end if;
end $$;

create table if not exists public.colors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hex text not null default '#000000',
  created_at timestamptz not null default now()
);

alter table public.colors
  alter column id set default gen_random_uuid();

create unique index if not exists colors_name_hex_idx
  on public.colors (lower(trim(name)), lower(trim(hex)));

create table if not exists public.sizes (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  created_at timestamptz not null default now()
);

alter table public.sizes
  alter column id set default gen_random_uuid();

create unique index if not exists sizes_label_idx
  on public.sizes (upper(trim(label)));

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_colors'
      and column_name = 'name'
  ) then
    insert into public.colors (id, name, hex)
    select gen_random_uuid(), distinct_pairs.name, distinct_pairs.hex
    from (
      select distinct trim(pc.name) as name, lower(trim(pc.hex)) as hex
      from public.product_colors pc
      where trim(pc.name) <> ''
        and trim(pc.hex) <> ''
    ) as distinct_pairs
    on conflict do nothing;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_sizes'
      and column_name = 'label'
  ) then
    insert into public.sizes (id, label)
    select gen_random_uuid(), distinct_pairs.label
    from (
      select distinct upper(trim(ps.label)) as label
      from public.product_sizes ps
      where trim(ps.label) <> ''
    ) as distinct_pairs
    on conflict do nothing;
  end if;
end $$;

alter table public.product_colors
  add column if not exists color_id uuid references public.colors (id) on delete restrict;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_colors'
      and column_name = 'name'
  ) then
    insert into public.colors (id, name, hex)
    select gen_random_uuid(), distinct_pairs.name, distinct_pairs.hex
    from (
      select distinct trim(pc.name) as name, lower(trim(pc.hex)) as hex
      from public.product_colors pc
      where pc.color_id is null
        and trim(pc.name) <> ''
        and trim(pc.hex) <> ''
    ) as distinct_pairs
    on conflict do nothing;

    update public.product_colors pc
    set color_id = c.id
    from public.colors c
    where pc.color_id is null
      and lower(trim(pc.name)) = lower(trim(c.name))
      and lower(trim(pc.hex)) = lower(trim(c.hex));

    delete from public.product_colors
    where color_id is null;

    alter table public.product_colors
      drop column if exists name,
      drop column if exists hex;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_colors'
      and column_name = 'color_id'
  ) and exists (
    select 1
    from public.product_colors
    where color_id is null
  ) then
    raise exception 'Some product_colors rows could not be mapped to colors.';
  end if;
end $$;

alter table public.product_colors
  alter column color_id set not null;

create unique index if not exists product_colors_product_color_idx
  on public.product_colors (product_id, color_id);

alter table public.product_sizes
  add column if not exists size_id uuid references public.sizes (id) on delete restrict;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_sizes'
      and column_name = 'label'
  ) then
    insert into public.sizes (id, label)
    select gen_random_uuid(), distinct_pairs.label
    from (
      select distinct upper(trim(ps.label)) as label
      from public.product_sizes ps
      where ps.size_id is null
        and trim(ps.label) <> ''
    ) as distinct_pairs
    on conflict do nothing;

    update public.product_sizes ps
    set size_id = s.id
    from public.sizes s
    where ps.size_id is null
      and upper(trim(ps.label)) = upper(trim(s.label));

    delete from public.product_sizes
    where size_id is null;

    alter table public.product_sizes
      drop column if exists label;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_sizes'
      and column_name = 'size_id'
  ) and exists (
    select 1
    from public.product_sizes
    where size_id is null
  ) then
    raise exception 'Some product_sizes rows could not be mapped to sizes.';
  end if;
end $$;

alter table public.product_sizes
  alter column size_id set not null;

create unique index if not exists product_sizes_product_size_idx
  on public.product_sizes (product_id, size_id);

alter table public.product_images
  add column if not exists color_id uuid references public.colors (id) on delete set null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_images'
      and column_name = 'color_name'
  ) then
    update public.product_images pi
    set color_id = c.id
    from public.product_colors pc
    join public.colors c on c.id = pc.color_id
    where pi.product_id = pc.product_id
      and pi.color_id is null
      and pi.color_name is not null
      and trim(pi.color_name) <> ''
      and lower(trim(pi.color_name)) = lower(trim(c.name));

    update public.product_images pi
    set color_id = c.id
    from public.colors c
    where pi.color_id is null
      and pi.color_name is not null
      and trim(pi.color_name) <> ''
      and lower(trim(pi.color_name)) = lower(trim(c.name));

    alter table public.product_images
      drop column if exists color_name;
  end if;
end $$;

alter table public.colors enable row level security;
alter table public.sizes enable row level security;

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
