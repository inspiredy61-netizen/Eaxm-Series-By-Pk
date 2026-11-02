-- EXAM SERIES BY PK — initial database schema
-- Run this file in Supabase SQL Editor on a NEW project.
-- Review the README before running. Do not run repeatedly on a live database without reviewing migrations.

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('student', 'admin');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null default '',
  phone text,
  exam_preference text default 'RRB NTPC',
  role public.user_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null,
  duration_minutes integer not null default 60 check (duration_minutes > 0),
  positive_marks numeric(8,2) not null default 1,
  negative_marks numeric(8,2) not null default 0,
  language text not null default 'Bilingual' check (language in ('Hindi','English','Bilingual')),
  is_published boolean not null default false,
  allow_reattempt boolean not null default true,
  show_result boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  position integer not null default 1,
  question_text text not null,
  question_text_hi text,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  option_a_hi text,
  option_b_hi text,
  option_c_hi text,
  option_d_hi text,
  correct_option text not null check (correct_option in ('A','B','C','D')),
  explanation text,
  subject text,
  marks numeric(8,2) not null default 1,
  created_at timestamptz not null default now(),
  unique(test_id, position)
);

create table if not exists public.pyq_papers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  exam_year integer,
  description text,
  duration_minutes integer not null default 90,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  test_id uuid not null references public.tests(id),
  attempted_count integer not null default 0,
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  unattempted_count integer not null default 0,
  total_marks numeric(10,2) not null default 0,
  score numeric(10,2) not null default 0,
  percentage numeric(6,2) not null default 0,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  is_published boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  details text not null,
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','completed')),
  created_at timestamptz not null default now()
);

-- Automatically create a student profile after signup. Public signup cannot choose a role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

-- RLS enabled on all application tables.
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.tests enable row level security;
alter table public.questions enable row level security;
alter table public.pyq_papers enable row level security;
alter table public.results enable row level security;
alter table public.announcements enable row level security;
alter table public.support_tickets enable row level security;
alter table public.account_deletion_requests enable row level security;

-- Profiles: students can read/update only their own profile. Admin can read/manage all profiles.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
for select to authenticated using (id = (select auth.uid()) or public.is_admin());
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
for update to authenticated using (id = (select auth.uid()) or public.is_admin())
with check ((id = (select auth.uid()) and role = 'student') or public.is_admin());

-- Categories
drop policy if exists "categories_read_active_or_admin" on public.categories;
create policy "categories_read_active_or_admin" on public.categories
for select to authenticated using (is_active = true or public.is_admin());
drop policy if exists "categories_admin_all" on public.categories;
create policy "categories_admin_all" on public.categories
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Tests and questions: only published content is visible to students.
drop policy if exists "tests_read_published_or_admin" on public.tests;
create policy "tests_read_published_or_admin" on public.tests
for select to authenticated using (is_published = true or public.is_admin());
drop policy if exists "tests_admin_all" on public.tests;
create policy "tests_admin_all" on public.tests
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "questions_read_published_test_or_admin" on public.questions;
create policy "questions_read_published_test_or_admin" on public.questions
for select to authenticated using (
  public.is_admin() or exists (
    select 1 from public.tests t where t.id = questions.test_id and t.is_published = true
  )
);
drop policy if exists "questions_admin_all" on public.questions;
create policy "questions_admin_all" on public.questions
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- PYQ papers
drop policy if exists "pyq_read_published_or_admin" on public.pyq_papers;
create policy "pyq_read_published_or_admin" on public.pyq_papers
for select to authenticated using (is_published = true or public.is_admin());
drop policy if exists "pyq_admin_all" on public.pyq_papers;
create policy "pyq_admin_all" on public.pyq_papers
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Results: student can read own and create own. Admin can read/manage all.
drop policy if exists "results_select_own_or_admin" on public.results;
create policy "results_select_own_or_admin" on public.results
for select to authenticated using (student_id = (select auth.uid()) or public.is_admin());
drop policy if exists "results_insert_own" on public.results;
create policy "results_insert_own" on public.results
for insert to authenticated with check (student_id = (select auth.uid()));
drop policy if exists "results_admin_all" on public.results;
create policy "results_admin_all" on public.results
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Announcements
drop policy if exists "announcements_read_published_or_admin" on public.announcements;
create policy "announcements_read_published_or_admin" on public.announcements
for select to authenticated using (is_published = true or public.is_admin());
drop policy if exists "announcements_admin_all" on public.announcements;
create policy "announcements_admin_all" on public.announcements
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Support and deletion requests
drop policy if exists "support_own_or_admin" on public.support_tickets;
create policy "support_own_or_admin" on public.support_tickets
for all to authenticated using (user_id = (select auth.uid()) or public.is_admin())
with check (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "deletion_own_or_admin" on public.account_deletion_requests;
create policy "deletion_own_or_admin" on public.account_deletion_requests
for all to authenticated using (user_id = (select auth.uid()) or public.is_admin())
with check (user_id = (select auth.uid()) or public.is_admin());

-- Seed the required railway categories.
insert into public.categories (name, description) values
('RRB NTPC','Railway Recruitment Board Non-Technical Popular Categories'),
('Group D','Railway Group D preparation'),
('ALP','Assistant Loco Pilot'),
('Technician','Railway Technician'),
('JE','Junior Engineer'),
('RPF Constable','Railway Protection Force Constable'),
('RPF SI','Railway Protection Force Sub-Inspector')
on conflict (name) do nothing;

-- IMPORTANT: after your own account is created and email verified, promote it manually:
-- update public.profiles set role = 'admin' where email = 'YOUR_ADMIN_EMAIL';
-- Run that single statement only after replacing the email with your verified admin email.
