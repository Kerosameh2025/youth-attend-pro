-- =====================================================================
-- Migration 004: Admin CRUD for servants (update / reset password / delete)
-- Run this in your Supabase SQL Editor (one-time).
-- =====================================================================

create extension if not exists pgcrypto;

-- Helper: is the current caller a super_admin?
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  )
$$;

-- ------------------------------------------------------------------
-- Update servant profile (name, username, permissions)
-- Also keeps auth.users.email in sync with the synthetic username email.
-- ------------------------------------------------------------------
create or replace function public.admin_update_servant(
  p_servant_id uuid,
  p_full_name text,
  p_username text,
  p_perm_add_student boolean,
  p_perm_edit_student boolean,
  p_perm_view_phones boolean,
  p_perm_take_attendance boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_email text;
  v_existing uuid;
begin
  if not public.is_super_admin() then
    raise exception 'Only super_admin can update servants';
  end if;

  if p_username is null or length(trim(p_username)) = 0 then
    raise exception 'username required';
  end if;

  -- Ensure username is not taken by someone else
  select id into v_existing
  from public.profiles
  where username = lower(trim(p_username))
    and id <> p_servant_id;
  if v_existing is not null then
    raise exception 'username taken';
  end if;

  v_new_email := lower(trim(p_username)) || '@servants.church.local';

  update public.profiles
  set full_name = p_full_name,
      username = lower(trim(p_username)),
      perm_add_student = coalesce(p_perm_add_student, false),
      perm_edit_student = coalesce(p_perm_edit_student, false),
      perm_view_phones = coalesce(p_perm_view_phones, false),
      perm_take_attendance = coalesce(p_perm_take_attendance, false)
  where id = p_servant_id;

  update auth.users
  set email = v_new_email,
      raw_user_meta_data =
        coalesce(raw_user_meta_data, '{}'::jsonb)
        || jsonb_build_object('username', lower(trim(p_username)),
                              'full_name', p_full_name)
  where id = p_servant_id;
end;
$$;

-- ------------------------------------------------------------------
-- Reset a servant's password
-- ------------------------------------------------------------------
create or replace function public.admin_reset_servant_password(
  p_servant_id uuid,
  p_new_password text
) returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Only super_admin can reset passwords';
  end if;

  if p_new_password is null or length(p_new_password) < 6 then
    raise exception 'Password must be at least 6 characters';
  end if;

  update auth.users
  set encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
      updated_at = now()
  where id = p_servant_id;
end;
$$;

-- ------------------------------------------------------------------
-- Delete a servant (auth user + profile via ON DELETE CASCADE)
-- ------------------------------------------------------------------
create or replace function public.admin_delete_servant(
  p_servant_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Only super_admin can delete servants';
  end if;

  if p_servant_id = auth.uid() then
    raise exception 'You cannot delete your own account';
  end if;

  delete from auth.users where id = p_servant_id;
end;
$$;

grant execute on function public.admin_update_servant(uuid, text, text, boolean, boolean, boolean, boolean) to authenticated;
grant execute on function public.admin_reset_servant_password(uuid, text) to authenticated;
grant execute on function public.admin_delete_servant(uuid) to authenticated;
