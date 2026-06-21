-- Run this in the Supabase SQL editor for your project.
--
-- Admin passwords are stored by Supabase Auth (auth.users), not in this table.
-- This table marks which auth users have admin access.

create table if not exists public.admins (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

drop policy if exists "Admins can view own admin record" on public.admins;

create policy "Admins can view own admin record"
  on public.admins
  for select
  using (auth.uid() = id);

create or replace function public.is_admin(check_user_id uuid default auth.uid())
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
  );
$$;

grant execute on function public.is_admin(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- How to create your first admin
-- ---------------------------------------------------------------------------
-- 1. In Supabase Dashboard: Authentication -> Users -> Add user
--    Enter the admin email and password (password is stored in auth.users).
-- 2. Copy the new user's UUID from the users list.
-- 3. Run the insert below with that UUID and email:
--
-- insert into public.admins (id, email)
-- values ('YOUR-USER-UUID-HERE', 'admin@yourstore.com');
