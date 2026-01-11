## Currently — project instructions

### Tech stack
- **Nuxt 3** + **Vue 3**
- **Supabase** (DB + REST)
- **Pinia** stores
- **Schedule‑X v3** calendar (Temporal-based)
- **OpenAI** (task voice notes + meeting import from text/screenshot)

### Local setup
- **Install deps**:

```bash
npm install
```

- **Create env file**:
  - Copy `env.example` → `.env`
  - Fill in required values.

### Required environment variables
- **Supabase**
  - `NUXT_PUBLIC_SUPABASE_URL`
  - `NUXT_PUBLIC_SUPABASE_KEY`
- **OpenAI**
  - `NUXT_PUBLIC_OPENAI_API_KEY`

### Run locally

```bash
npm run dev
```

### Useful scripts
- **lint**: `npm run lint`
- **typecheck**: `npm run typecheck`
- **format**: `npm run format`

### Supabase migrations (manual)
This repo does not run Supabase CLI migrations automatically.

Run this SQL in Supabase SQL Editor:
- `supabase/migrations/20260110_0001_calendar_events_and_task_time.sql`

It:
- creates `public.calendar_events` (meetings/events)
- adds `start_at` / `end_at` to `public.tasks` if missing
- adds indexes + unique key `(source, source_uid)` for upsert

### Calendar / Meetings
- **Calendar page**: `/calendar`
- **Meetings** are stored in `public.calendar_events`
- **Upsert key**: `(source, source_uid)` where `source_uid` is iCalendar UID / provider event id
- **Timezone**: rendered in the user’s local timezone using Temporal
- **Recurring meetings**: stored as `rrule` and expanded client-side for the visible range

### Imports (Calendar page → Import)
Supported in-app imports:
- **Upload `.ics`**
- **Paste ICS / plain text**
- **Upload screenshot** (AI extraction)

Planned (UI placeholders exist):
- Google Calendar sync
- Outlook sync

### Code structure notes
- Schedule‑X wrapper:
  - UI: `app/components/calendar/ScheduleXCalendarView.client.vue`
  - Composable: `app/composables/useScheduleXCalendar.ts`
  - Helpers: `app/helpers/calendar/schedulex.ts`

