-- Migration: Calendar events + optional task time range
-- Apply this in Supabase SQL editor (or CLI migrations).

-- Enable UUID generation if not already enabled
create extension if not exists "pgcrypto";

-- 1) Meetings / events table
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),

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
  source text not null default 'import', -- import | google | outlook | manual
  source_uid text,                      -- iCal UID or provider event id
  source_calendar text,                 -- optional calendar name/id

  raw_payload text,                     -- store raw VEVENT/ICS or AI input for debugging

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calendar_events_start_at_idx on public.calendar_events (start_at);
create index if not exists calendar_events_end_at_idx on public.calendar_events (end_at);

-- Unique upsert key (NULLs are allowed and don't conflict)
drop index if exists public.calendar_events_source_uid_uniq;
create unique index if not exists calendar_events_source_uid_uniq
  on public.calendar_events (source, source_uid);

-- 2) Optional task time range: start/end timestamps
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tasks'
      and column_name = 'start_at'
  ) then
    alter table public.tasks add column start_at timestamptz null;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tasks'
      and column_name = 'end_at'
  ) then
    alter table public.tasks add column end_at timestamptz null;
  end if;
end $$;

create index if not exists tasks_start_at_idx on public.tasks (start_at);
create index if not exists tasks_end_at_idx on public.tasks (end_at);

