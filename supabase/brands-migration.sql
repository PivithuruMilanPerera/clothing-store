-- Brands catalog for the admin product form.
-- Run in the Supabase SQL editor after products.sql.
-- Safe to re-run after a partial failure.

create extension if not exists pgcrypto;

-- Drop legacy brands table if it has the wrong schema.
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'brands'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'brands'
      and column_name = 'name'
  ) then
    drop table public.brands cascade;
  end if;
end $$;

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.brands
  alter column id set default gen_random_uuid();

create unique index if not exists brands_name_idx
  on public.brands (lower(trim(name)));

insert into public.brands (id, name)
select gen_random_uuid(), distinct_pairs.name
from (
  select distinct trim(p.brand) as name
  from public.products p
  where trim(p.brand) <> ''
) as distinct_pairs
on conflict do nothing;

alter table public.brands enable row level security;

drop policy if exists "Anyone can view brands" on public.brands;
create policy "Anyone can view brands"
  on public.brands for select
  using (true);

drop policy if exists "Admins can manage brands" on public.brands;
create policy "Admins can manage brands"
  on public.brands for all
  using (public.is_admin())
  with check (public.is_admin());
