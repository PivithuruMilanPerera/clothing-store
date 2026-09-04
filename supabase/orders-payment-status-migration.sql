-- Run this in Supabase SQL editor to track payment status separately from order status

alter table public.orders
  add column if not exists payment_status text not null default 'pending';

alter table public.orders
  drop constraint if exists orders_payment_status_check;

alter table public.orders
  add constraint orders_payment_status_check
  check (payment_status in ('pending', 'paid', 'failed'));

-- Existing COD orders: treat as processing with payment still pending
update public.orders
set
  status = case
    when payment_method = 'cash_on_delivery'
      and status = 'pending'
      then 'processing'
    else status
  end,
  payment_status = case
    when payment_method = 'card' and status in ('processing', 'shipped', 'delivered')
      then 'paid'
    when payment_method = 'card' and status = 'cancelled'
      then payment_status
    else coalesce(nullif(payment_status, ''), 'pending')
  end,
  updated_at = now()
where true;
