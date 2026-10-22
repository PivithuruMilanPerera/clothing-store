-- Milestone 4: admin dashboard, reporting, super admin and platform settings.
-- Run in the Supabase SQL editor after all earlier migrations. Safe to re-run.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Admin roles (admin / super_admin)
-- ---------------------------------------------------------------------------
alter table public.admins
  add column if not exists role text not null default 'admin';

alter table public.admins
  add column if not exists full_name text not null default '';

alter table public.admins
  add column if not exists updated_at timestamptz not null default now();

alter table public.admins
  drop constraint if exists admins_role_check;

alter table public.admins
  add constraint admins_role_check check (role in ('admin', 'super_admin'));

-- Promote the earliest admin when no super admin exists yet.
update public.admins
set role = 'super_admin'
where id = (
  select id from public.admins order by created_at asc limit 1
)
and not exists (select 1 from public.admins where role = 'super_admin');

create or replace function public.is_super_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins
    where id = check_user_id
      and role = 'super_admin'
  );
$$;

grant execute on function public.is_super_admin(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Orders: coupon + discount columns
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists coupon_code text;

alter table public.orders
  add column if not exists discount numeric(10, 2) not null default 0;

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_coupon_code_idx on public.orders (coupon_code);
create index if not exists orders_customer_email_idx on public.orders (lower(customer_email));

-- ---------------------------------------------------------------------------
-- 3. Order status history (tracking timeline)
-- ---------------------------------------------------------------------------
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status text not null,
  payment_status text,
  tracking_number text,
  note text,
  changed_by uuid references auth.users (id) on delete set null,
  changed_by_email text,
  created_at timestamptz not null default now()
);

create index if not exists order_status_history_order_id_idx
  on public.order_status_history (order_id, created_at);

alter table public.order_status_history enable row level security;

drop policy if exists "Users can view own order history" on public.order_status_history;
create policy "Users can view own order history"
  on public.order_status_history for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_status_history.order_id
        and o.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can manage order history" on public.order_status_history;
create policy "Admins can manage order history"
  on public.order_status_history for all
  using (public.is_admin())
  with check (public.is_admin());

-- Seed one "placed" entry for existing orders so every order has a timeline.
insert into public.order_status_history (order_id, status, payment_status, note, created_at)
select o.id, o.status, o.payment_status, 'Order placed', o.created_at
from public.orders o
where not exists (
  select 1 from public.order_status_history h where h.order_id = o.id
);

-- ---------------------------------------------------------------------------
-- 4. Return requests: admin decision fields
-- ---------------------------------------------------------------------------
alter table public.return_requests
  add column if not exists admin_note text;

alter table public.return_requests
  add column if not exists resolved_at timestamptz;

alter table public.return_requests
  add column if not exists resolved_by uuid references auth.users (id) on delete set null;

drop policy if exists "Admins can manage return requests" on public.return_requests;
create policy "Admins can manage return requests"
  on public.return_requests for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 5. Coupons
-- ---------------------------------------------------------------------------
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  description text not null default '',
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10, 2) not null check (discount_value > 0),
  min_order_amount numeric(10, 2) not null default 0 check (min_order_amount >= 0),
  max_discount_amount numeric(10, 2) check (max_discount_amount is null or max_discount_amount > 0),
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  used_count integer not null default 0 check (used_count >= 0),
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists coupons_code_idx on public.coupons (upper(trim(code)));

alter table public.coupons enable row level security;

drop policy if exists "Admins can manage coupons" on public.coupons;
create policy "Admins can manage coupons"
  on public.coupons for all
  using (public.is_admin())
  with check (public.is_admin());

-- Atomically consume one coupon use; returns false when the limit is reached.
create or replace function public.redeem_coupon(coupon_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_rows integer;
begin
  update public.coupons
  set used_count = used_count + 1,
      updated_at = now()
  where id = coupon_id
    and is_active = true
    and (usage_limit is null or used_count < usage_limit);

  get diagnostics updated_rows = row_count;
  return updated_rows > 0;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Delivery rates by district / city
-- ---------------------------------------------------------------------------
create table if not exists public.delivery_rates (
  id uuid primary key default gen_random_uuid(),
  area_type text not null check (area_type in ('district', 'city')),
  name text not null,
  rate numeric(10, 2) not null check (rate >= 0),
  free_shipping_threshold numeric(10, 2)
    check (free_shipping_threshold is null or free_shipping_threshold >= 0),
  estimated_days text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists delivery_rates_area_name_idx
  on public.delivery_rates (area_type, lower(trim(name)));

alter table public.delivery_rates enable row level security;

drop policy if exists "Anyone can view delivery rates" on public.delivery_rates;
create policy "Anyone can view delivery rates"
  on public.delivery_rates for select
  using (true);

drop policy if exists "Admins can manage delivery rates" on public.delivery_rates;
create policy "Admins can manage delivery rates"
  on public.delivery_rates for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 7. Store settings (key/value)
-- ---------------------------------------------------------------------------
create table if not exists public.store_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.store_settings enable row level security;

drop policy if exists "Anyone can view store settings" on public.store_settings;
create policy "Anyone can view store settings"
  on public.store_settings for select
  using (true);

drop policy if exists "Admins can manage store settings" on public.store_settings;
create policy "Admins can manage store settings"
  on public.store_settings for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.store_settings (key, value)
values
  ('shipping', '{"defaultRate": 350, "freeShippingThreshold": 5000}'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 8. Per-product low-stock threshold (null = store default of 5)
-- ---------------------------------------------------------------------------
alter table public.products
  add column if not exists low_stock_threshold integer;

alter table public.products
  drop constraint if exists products_low_stock_threshold_check;

alter table public.products
  add constraint products_low_stock_threshold_check
  check (low_stock_threshold is null or low_stock_threshold >= 0);

-- ---------------------------------------------------------------------------
-- 9. Email notification templates (overrides for built-in copy)
-- ---------------------------------------------------------------------------
create table if not exists public.email_templates (
  key text primary key,
  subject text not null,
  heading text not null,
  intro text not null,
  footer text not null,
  is_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table public.email_templates enable row level security;

drop policy if exists "Admins can manage email templates" on public.email_templates;
create policy "Admins can manage email templates"
  on public.email_templates for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 10. Saved delivery addresses: phone and district
-- ---------------------------------------------------------------------------
alter table public.addresses
  add column if not exists phone text;

alter table public.addresses
  add column if not exists district text;

-- ---------------------------------------------------------------------------
-- 11. Return requests: one request per order item
-- ---------------------------------------------------------------------------
alter table public.return_requests
  add column if not exists order_item_id uuid references public.order_items (id) on delete set null;

create index if not exists return_requests_order_item_id_idx
  on public.return_requests (order_item_id);
