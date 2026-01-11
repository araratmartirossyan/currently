-- Owner auth + public read-only calendar (RLS)
--
-- After running this migration:
-- 1) Sign up/sign in in Supabase Auth as the OWNER user.
-- 2) Get your owner user id (UUID) from the Supabase Auth user.
-- 3) Run:
--    update public.app_settings set owner_user_id = '<OWNER_UUID>' where id = 1;
--    update public.projects set user_id = '<OWNER_UUID>' where user_id is null;
--    update public.tasks set user_id = '<OWNER_UUID>' where user_id is null;
--    update public.calendar_events set user_id = '<OWNER_UUID>' where user_id is null;
--
-- Until owner_user_id + backfills are done, public calendar may show no events.

create table if not exists public.app_settings (
  id int primary key,
  owner_user_id uuid null,
  public_calendar_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id) values (1)
on conflict (id) do nothing;

-- helpers to avoid granting direct access to app_settings
create or replace function public.owner_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select owner_user_id from public.app_settings where id = 1
$$;

create or replace function public.public_calendar_enabled()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public_calendar_enabled from public.app_settings where id = 1
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and auth.uid() = public.owner_user_id()
$$;

-- Add ownership columns (nullable for safe transition)
alter table public.projects add column if not exists user_id uuid null;
alter table public.tasks add column if not exists user_id uuid null;
alter table public.calendar_events add column if not exists user_id uuid null;

-- Default for new rows
alter table public.projects alter column user_id set default auth.uid();
alter table public.tasks alter column user_id set default auth.uid();
alter table public.calendar_events alter column user_id set default auth.uid();

-- Best-effort backfill from configured owner (if already set)
update public.projects
set user_id = public.owner_user_id()
where user_id is null and public.owner_user_id() is not null;

update public.tasks
set user_id = public.owner_user_id()
where user_id is null and public.owner_user_id() is not null;

update public.calendar_events
set user_id = public.owner_user_id()
where user_id is null and public.owner_user_id() is not null;

-- Enable RLS
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.calendar_events enable row level security;

-- Projects: owner only
do $$
begin
  begin
    create policy projects_owner_select
      on public.projects
      for select
      using (public.is_owner() and user_id = auth.uid());
  exception when duplicate_object then end;

  begin
    create policy projects_owner_insert
      on public.projects
      for insert
      with check (public.is_owner() and user_id = auth.uid());
  exception when duplicate_object then end;

  begin
    create policy projects_owner_update
      on public.projects
      for update
      using (public.is_owner() and user_id = auth.uid())
      with check (public.is_owner() and user_id = auth.uid());
  exception when duplicate_object then end;

  begin
    create policy projects_owner_delete
      on public.projects
      for delete
      using (public.is_owner() and user_id = auth.uid());
  exception when duplicate_object then end;
end $$;

-- Tasks: owner only
do $$
begin
  begin
    create policy tasks_owner_select
      on public.tasks
      for select
      using (public.is_owner() and user_id = auth.uid());
  exception when duplicate_object then end;

  begin
    create policy tasks_owner_insert
      on public.tasks
      for insert
      with check (public.is_owner() and user_id = auth.uid());
  exception when duplicate_object then end;

  begin
    create policy tasks_owner_update
      on public.tasks
      for update
      using (public.is_owner() and user_id = auth.uid())
      with check (public.is_owner() and user_id = auth.uid());
  exception when duplicate_object then end;

  begin
    create policy tasks_owner_delete
      on public.tasks
      for delete
      using (public.is_owner() and user_id = auth.uid());
  exception when duplicate_object then end;
end $$;

-- Calendar events:
-- - owner can CRUD their rows
-- - anyone (including anon) can SELECT owner's rows if public calendar is enabled
do $$
begin
  begin
    create policy calendar_events_owner_select
      on public.calendar_events
      for select
      using (public.is_owner() and user_id = auth.uid());
  exception when duplicate_object then end;

  begin
    create policy calendar_events_public_select
      on public.calendar_events
      for select
      using (
        public.public_calendar_enabled()
        and public.owner_user_id() is not null
        and user_id = public.owner_user_id()
      );
  exception when duplicate_object then end;

  begin
    create policy calendar_events_owner_insert
      on public.calendar_events
      for insert
      with check (public.is_owner() and user_id = auth.uid());
  exception when duplicate_object then end;

  begin
    create policy calendar_events_owner_update
      on public.calendar_events
      for update
      using (public.is_owner() and user_id = auth.uid())
      with check (public.is_owner() and user_id = auth.uid());
  exception when duplicate_object then end;

  begin
    create policy calendar_events_owner_delete
      on public.calendar_events
      for delete
      using (public.is_owner() and user_id = auth.uid());
  exception when duplicate_object then end;
end $$;

