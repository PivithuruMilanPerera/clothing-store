-- Run this in the Supabase SQL editor if product create/update fails with:
-- "Could not find the 'category_id' column of 'products' in the schema cache"

alter table public.products
  add column if not exists category_id uuid references public.categories (id) on delete restrict;

create index if not exists products_category_id_idx on public.products (category_id);

-- Assign existing products to the first category when category_id is missing.
update public.products p
set category_id = (
  select c.id
  from public.categories c
  order by c.created_at asc
  limit 1
)
where p.category_id is null
  and exists (select 1 from public.categories c);

-- Enforce category on new products once existing rows are backfilled.
do $$
begin
  if not exists (
    select 1
    from public.products
    where category_id is null
  ) then
    alter table public.products
      alter column category_id set not null;
  end if;
end;
$$;
