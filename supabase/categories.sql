-- Run this in the Supabase SQL editor after admins.sql

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references public.categories (id) on delete cascade,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_parent_id_idx on public.categories (parent_id);
create index if not exists categories_slug_idx on public.categories (slug);

create or replace function public.set_categories_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_categories_updated_at();

create or replace function public.enforce_main_categories_limit()
returns trigger
language plpgsql
as $$
declare
  main_category_count integer;
begin
  if new.parent_id is null then
    select count(*)
      into main_category_count
      from public.categories
      where parent_id is null
        and (tg_op = 'INSERT' or id <> new.id);

    if main_category_count >= 8 then
      raise exception 'Maximum of 8 main categories is allowed.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists categories_main_limit on public.categories;
create trigger categories_main_limit
before insert or update on public.categories
for each row execute function public.enforce_main_categories_limit();

alter table public.categories enable row level security;

drop policy if exists "Anyone can view categories" on public.categories;
create policy "Anyone can view categories"
  on public.categories
  for select
  using (true);

drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories"
  on public.categories
  for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.categories (name, slug, parent_id)
values
  ('Mens', 'mens', null),
  ('Womens', 'womens', null),
  ('Baby & Kids', 'baby-kids', null),
  ('Accessories', 'accessories', null)
on conflict (slug) do nothing;
