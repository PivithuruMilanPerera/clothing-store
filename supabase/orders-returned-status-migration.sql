-- Run this in the Supabase SQL editor to allow "returned" as an order status

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (
    status in (
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'returned'
    )
  );
