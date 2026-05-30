-- Add birth_date column to students table
alter table public.students add column if not exists birth_date date;
