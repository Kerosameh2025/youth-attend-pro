-- =====================================================================
-- Church Service Attendance — Database Schema
-- Run this entire file inside your Supabase SQL Editor (one-time setup).
-- =====================================================================

-- ---------- 1) ROLES ----------
create type public.app_role as enum ('super_admin', 'servant');

-- ---------- 2) PROFILES (one row per auth user) ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'servant',
  -- permissions for servants:
  perm_add_student boolean not null default false,
  perm_edit_student boolean not null default false,
  perm_view_phones boolean not null default false,
  perm_take_attendance boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Helper: check if a user is super admin (SECURITY DEFINER avoids recursion)
create or replace function public.is_super_admin(_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = _uid and role = 'super_admin');
$$;

-- Helper: get a permission flag for current user
create or replace function public.has_perm(_uid uuid, _perm text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v boolean;
begin
  if public.is_super_admin(_uid) then return true; end if;
  execute format('select coalesce(%I,false) from public.profiles where id = $1', 'perm_' || _perm)
    into v using _uid;
  return coalesce(v, false);
end;
$$;

-- Trigger: auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'servant');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profiles policies
create policy "profiles_self_select" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "profiles_admin_select_all" on public.profiles
  for select to authenticated using (public.is_super_admin(auth.uid()));
create policy "profiles_admin_update" on public.profiles
  for update to authenticated using (public.is_super_admin(auth.uid()));
create policy "profiles_self_update_name" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- ---------- 3) STUDENTS ----------
create table public.students (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  age int,
  phones text[] not null default '{}',
  address text,
  school text,
  father_job text,
  notes text,
  photo_path text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.students enable row level security;

create policy "students_select_auth" on public.students
  for select to authenticated using (true);
create policy "students_insert_perm" on public.students
  for insert to authenticated with check (public.has_perm(auth.uid(), 'add_student'));
create policy "students_update_perm" on public.students
  for update to authenticated using (public.has_perm(auth.uid(), 'edit_student'));
create policy "students_delete_admin" on public.students
  for delete to authenticated using (public.is_super_admin(auth.uid()));

-- ---------- 4) FRIDAY SESSIONS ----------
create table public.friday_sessions (
  id uuid primary key default gen_random_uuid(),
  session_date date unique not null,
  created_at timestamptz not null default now()
);

alter table public.friday_sessions enable row level security;

create policy "sessions_select_auth" on public.friday_sessions
  for select to authenticated using (true);
create policy "sessions_admin_all" on public.friday_sessions
  for all to authenticated using (public.is_super_admin(auth.uid()))
  with check (public.is_super_admin(auth.uid()));

-- ---------- 5) ATTENDANCE ----------
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.friday_sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  present boolean not null default false,
  marked_by uuid references auth.users(id),
  marked_at timestamptz not null default now(),
  unique (session_id, student_id)
);

alter table public.attendance enable row level security;

create policy "attendance_select_auth" on public.attendance
  for select to authenticated using (true);
create policy "attendance_insert_perm" on public.attendance
  for insert to authenticated with check (public.has_perm(auth.uid(), 'take_attendance'));
create policy "attendance_update_perm" on public.attendance
  for update to authenticated using (public.has_perm(auth.uid(), 'take_attendance'));

-- ---------- 6) STORAGE BUCKET FOR PHOTOS ----------
insert into storage.buckets (id, name, public)
values ('student-photos', 'student-photos', false)
on conflict (id) do nothing;

-- Storage policies: all authenticated users can read/write (RLS on students table guards business logic)
create policy "photos_read_auth" on storage.objects
  for select to authenticated using (bucket_id = 'student-photos');
create policy "photos_insert_auth" on storage.objects
  for insert to authenticated with check (bucket_id = 'student-photos');
create policy "photos_update_auth" on storage.objects
  for update to authenticated using (bucket_id = 'student-photos');
create policy "photos_delete_auth" on storage.objects
  for delete to authenticated using (bucket_id = 'student-photos');

-- =====================================================================
-- AFTER RUNNING:
-- 1) Create your first user via the app's signup page.
-- 2) In Supabase SQL Editor, promote yourself to super admin:
--    update public.profiles set role = 'super_admin' where id = (select id from auth.users where email = 'YOUR_EMAIL');
-- =====================================================================
