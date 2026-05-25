-- =====================================================================
-- Phase 3: Servant login activity tracking
-- Run this inside the Supabase SQL Editor.
-- =====================================================================

create table if not exists public.servant_logins (
  id uuid primary key default gen_random_uuid(),
  servant_id uuid not null references public.profiles(id) on delete cascade,
  logged_in_at timestamptz not null default now(),
  device_info jsonb not null default '{}'::jsonb
);

create index if not exists servant_logins_servant_idx
  on public.servant_logins (servant_id, logged_in_at desc);

alter table public.servant_logins enable row level security;

-- Any authenticated user can insert their OWN login row (used right after sign-in)
drop policy if exists "servant_logins_insert_self" on public.servant_logins;
create policy "servant_logins_insert_self" on public.servant_logins
  for insert to authenticated
  with check (auth.uid() = servant_id);

-- Only super admins can read the login history
drop policy if exists "servant_logins_select_admin" on public.servant_logins;
create policy "servant_logins_select_admin" on public.servant_logins
  for select to authenticated
  using (public.is_super_admin(auth.uid()));

-- Optional: admin can delete (cleanup)
drop policy if exists "servant_logins_delete_admin" on public.servant_logins;
create policy "servant_logins_delete_admin" on public.servant_logins
  for delete to authenticated
  using (public.is_super_admin(auth.uid()));
