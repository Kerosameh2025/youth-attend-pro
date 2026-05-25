-- =====================================================================
-- Migration 002: Servant username login + remove public signup
-- Run this in your Supabase SQL Editor (one-time).
-- =====================================================================

alter table public.profiles
  add column if not exists username text unique;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'servant'),
    nullif(new.raw_user_meta_data->>'username', '')
  );
  return new;
end;
$$;
