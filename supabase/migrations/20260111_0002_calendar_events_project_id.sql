-- Migration: add project_id to calendar_events (meetings belong to project)

alter table public.calendar_events
  add column if not exists project_id uuid null;

-- FK to projects (best-effort: may fail if projects table not present)
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'projects'
  ) then
    begin
      alter table public.calendar_events
        add constraint calendar_events_project_id_fkey
        foreign key (project_id) references public.projects(id)
        on delete set null;
    exception when duplicate_object then
      -- ignore
    end;
  end if;
end $$;

create index if not exists calendar_events_project_id_idx on public.calendar_events (project_id);

