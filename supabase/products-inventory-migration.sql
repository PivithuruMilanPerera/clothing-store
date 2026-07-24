-- Add inventory stock quantity to products
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
