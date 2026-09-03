-- Run this in Supabase SQL editor to enable guest checkout and detailed order fields

-- 1. Allow user_id to be nullable for guest checkouts
alter table public.orders
  alter column user_id drop not null;

-- 2. Add customer details and payment fields to orders
alter table public.orders
  add column if not exists customer_email text,
  add column if not exists customer_name text,
  add column if not exists customer_phone text,
  add column if not exists payment_method text default 'cash_on_delivery',
  add column if not exists is_guest boolean default false;

-- 3. Update RLS policies for orders
drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
  on public.orders for select
  using (
    auth.uid() = user_id or user_id is null
  );

drop policy if exists "Users can insert own orders" on public.orders;
create policy "Users can insert own orders"
  on public.orders for insert
  with check (
    auth.uid() = user_id or user_id is null
  );

drop policy if exists "Users can insert order items" on public.order_items;
create policy "Users can insert order items"
  on public.order_items for insert
  with check (true);
