-- Run this in the Supabase SQL editor to store shipment tracking numbers

alter table public.orders
  add column if not exists tracking_number text;
