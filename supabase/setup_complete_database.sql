-- ============================================================================
-- Complete Database Setup for "Currently" App
-- ============================================================================
-- This script creates all tables, indexes, functions, and RLS policies
-- Run this in your Supabase SQL Editor for a fresh database setup
-- ============================================================================

-- Enable required extensions
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. PROJECTS TABLE
-- ============================================================================
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null default auth.uid(),
  name text not null,
  description text,
  color text,
  category text,
  subcategory text,
  created_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists projects_created_at_idx on public.projects (created_at);

-- ============================================================================
-- 2. TASKS TABLE
-- ============================================================================
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null default auth.uid(),
  title text not null,
  description text,
  status text not null default 'pending',
  priority text not null default 'medium',
  project_id uuid null,
  category text,
  subcategory text,
  tags text[] not null default '{}',
  attachments text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deadline timestamptz,
  start_at timestamptz,
  end_at timestamptz,
  
  constraint tasks_project_id_fkey 
    foreign key (project_id) 
    references public.projects(id) 
    on delete set null
);

create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_project_id_idx on public.tasks (project_id);
create index if not exists tasks_status_idx on public.tasks (status);
create index if not exists tasks_created_at_idx on public.tasks (created_at);
create index if not exists tasks_start_at_idx on public.tasks (start_at);
create index if not exists tasks_end_at_idx on public.tasks (end_at);
create index if not exists tasks_deadline_idx on public.tasks (deadline);

-- ============================================================================
-- 3. CALENDAR EVENTS TABLE
-- ============================================================================
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null default auth.uid(),
  project_id uuid null,
  title text not null,
  description text,
  location text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  is_all_day boolean not null default false,
  
  -- Recurrence (store raw rules; expansion handled in app)
  rrule text,
  exdates timestamptz[],
  
  -- Source for upsert/dedup across providers/imports
  source text not null default 'manual',
  source_uid text,
  source_calendar text,
  
  raw_payload text,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  constraint calendar_events_project_id_fkey 
    foreign key (project_id) 
    references public.projects(id) 
    on delete set null
);

create index if not exists calendar_events_user_id_idx on public.calendar_events (user_id);
create index if not exists calendar_events_project_id_idx on public.calendar_events (project_id);
create index if not exists calendar_events_start_at_idx on public.calendar_events (start_at);
create index if not exists calendar_events_end_at_idx on public.calendar_events (end_at);

-- Unique upsert key (NULLs are allowed and don't conflict)
create unique index if not exists calendar_events_source_uid_uniq
  on public.calendar_events (source, source_uid)
  where source_uid is not null;

-- ============================================================================
-- 4. APP SETTINGS TABLE
-- ============================================================================
create table if not exists public.app_settings (
  id int primary key,
  owner_user_id uuid null,
  public_calendar_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Initialize with default row
insert into public.app_settings (id) 
values (1)
on conflict (id) do nothing;

-- ============================================================================
-- 5. HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Function to get the owner user ID
create or replace function public.owner_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select owner_user_id from public.app_settings where id = 1
$$;

-- Function to check if public calendar is enabled
create or replace function public.public_calendar_enabled()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public_calendar_enabled from public.app_settings where id = 1
$$;

-- Function to check if current user is the owner
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and auth.uid() = public.owner_user_id()
$$;

-- ============================================================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.calendar_events enable row level security;

-- ============================================================================
-- 7. RLS POLICIES - PROJECTS (Owner Only)
-- ============================================================================
drop policy if exists projects_owner_select on public.projects;
create policy projects_owner_select
  on public.projects
  for select
  using (public.is_owner() and user_id = auth.uid());

drop policy if exists projects_owner_insert on public.projects;
create policy projects_owner_insert
  on public.projects
  for insert
  with check (public.is_owner() and user_id = auth.uid());

drop policy if exists projects_owner_update on public.projects;
create policy projects_owner_update
  on public.projects
  for update
  using (public.is_owner() and user_id = auth.uid())
  with check (public.is_owner() and user_id = auth.uid());

drop policy if exists projects_owner_delete on public.projects;
create policy projects_owner_delete
  on public.projects
  for delete
  using (public.is_owner() and user_id = auth.uid());

-- ============================================================================
-- 8. RLS POLICIES - TASKS (Owner Only)
-- ============================================================================
drop policy if exists tasks_owner_select on public.tasks;
create policy tasks_owner_select
  on public.tasks
  for select
  using (public.is_owner() and user_id = auth.uid());

drop policy if exists tasks_owner_insert on public.tasks;
create policy tasks_owner_insert
  on public.tasks
  for insert
  with check (public.is_owner() and user_id = auth.uid());

drop policy if exists tasks_owner_update on public.tasks;
create policy tasks_owner_update
  on public.tasks
  for update
  using (public.is_owner() and user_id = auth.uid())
  with check (public.is_owner() and user_id = auth.uid());

drop policy if exists tasks_owner_delete on public.tasks;
create policy tasks_owner_delete
  on public.tasks
  for delete
  using (public.is_owner() and user_id = auth.uid());

-- ============================================================================
-- 9. RLS POLICIES - CALENDAR EVENTS (Owner + Public Read)
-- ============================================================================
-- Owner can select their own events
drop policy if exists calendar_events_owner_select on public.calendar_events;
create policy calendar_events_owner_select
  on public.calendar_events
  for select
  using (public.is_owner() and user_id = auth.uid());

-- Public can select owner's events if public calendar is enabled
drop policy if exists calendar_events_public_select on public.calendar_events;
create policy calendar_events_public_select
  on public.calendar_events
  for select
  using (
    public.public_calendar_enabled()
    and public.owner_user_id() is not null
    and user_id = public.owner_user_id()
  );

-- Owner can insert
drop policy if exists calendar_events_owner_insert on public.calendar_events;
create policy calendar_events_owner_insert
  on public.calendar_events
  for insert
  with check (public.is_owner() and user_id = auth.uid());

-- Owner can update
drop policy if exists calendar_events_owner_update on public.calendar_events;
create policy calendar_events_owner_update
  on public.calendar_events
  for update
  using (public.is_owner() and user_id = auth.uid())
  with check (public.is_owner() and user_id = auth.uid());

-- Owner can delete
drop policy if exists calendar_events_owner_delete on public.calendar_events;
create policy calendar_events_owner_delete
  on public.calendar_events
  for delete
  using (public.is_owner() and user_id = auth.uid());

-- ============================================================================
-- 10. POST-SETUP INSTRUCTIONS
-- ============================================================================
-- After running this script:
-- 
-- 1. Sign up/sign in to your app to create your owner user in Supabase Auth
-- 
-- 2. Get your user UUID from Supabase Dashboard > Authentication > Users
-- 
-- 3. Run this SQL to set yourself as the owner:
--    
--    update public.app_settings 
--    set owner_user_id = 'YOUR_USER_UUID_HERE' 
--    where id = 1;
--
-- 4. (Optional) Backfill any existing data with your user_id:
--
--    update public.projects 
--    set user_id = 'YOUR_USER_UUID_HERE' 
--    where user_id is null;
--
--    update public.tasks 
--    set user_id = 'YOUR_USER_UUID_HERE' 
--    where user_id is null;
--
--    update public.calendar_events 
--    set user_id = 'YOUR_USER_UUID_HERE' 
--    where user_id is null;
--
-- ============================================================================
