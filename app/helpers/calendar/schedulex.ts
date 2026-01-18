import type { CalendarEvent, Task } from "@/types";
import { RRule } from "rrule";

export type ScheduleXRange = { startIso: string; endIso: string };

export type ScheduleXMode = "meetings" | "tasks" | "all";

export type ScheduleXEvent = {
  id: string;
  title: string;
  // Schedule‑X expects Temporal types here
  start: Temporal.ZonedDateTime | Temporal.PlainDate;
  end: Temporal.ZonedDateTime | Temporal.PlainDate;
  calendarId?: string;
  kind: "task" | "meeting";
  originalId: string;
};

export function getUserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function safeTimedEnd(startIso: string, endIso: string) {
  const startMs = new Date(startIso).getTime();
  const endMs = new Date(endIso).getTime();
  if (!Number.isFinite(startMs)) return endIso;
  if (!Number.isFinite(endMs) || endMs <= startMs)
    return new Date(startMs + 60 * 60 * 1000).toISOString();
  return endIso;
}

export function toTemporalZdt(iso: string, timeZone: string) {
  const instant = Temporal.Instant.from(new Date(iso).toISOString());
  return instant.toZonedDateTimeISO(timeZone);
}

export function toTemporalPlainDate(iso: string) {
  return Temporal.PlainDate.from(new Date(iso).toISOString().slice(0, 10));
}

function toPlainDateInTimeZone(iso: string, timeZone: string) {
  const instant = Temporal.Instant.from(new Date(iso).toISOString());
  return instant.toZonedDateTimeISO(timeZone).toPlainDate();
}

function getAllDaySpanDays(startIso: string, endIso: string, timeZone: string) {
  const start = toPlainDateInTimeZone(startIso, timeZone);
  const endExclusive = toPlainDateInTimeZone(endIso, timeZone);
  const days = endExclusive.since(start, { largestUnit: "days" }).days;
  return Math.max(1, days || 1);
}

function toAllDayPlainDateRange(startIso: string, endIso: string, timeZone: string) {
  const start = toPlainDateInTimeZone(startIso, timeZone);
  const spanDays = getAllDaySpanDays(startIso, endIso, timeZone);
  const end = start.add({ days: spanDays });
  return { start, end, spanDays };
}

export function rangePartToIso(rangePart: unknown) {
  // schedule-x may pass Temporal.PlainDate (YYYY-MM-DD) or Temporal.ZonedDateTime strings with bracketed zone
  let s = String(rangePart);
  
  // Handle Temporal objects directly if possible (they'll stringify their contents)
  if (typeof rangePart === "object" && rangePart !== null) {
    // Handle Temporal.ZonedDateTime objects which have toInstant() and timeZone
    if ("toInstant" in rangePart && "timeZoneId" in rangePart) {
      try {
        const zdtLike = rangePart as { toInstant: () => Temporal.Instant };
        return zdtLike.toInstant().toString();
      } catch {
        // Fall through to string handling if this fails
      }
    }
    
    // Handle Temporal.PlainDateTime objects which have hour/minute but aren't zoned
    if ("hour" in rangePart && "minute" in rangePart && "year" in rangePart) {
      try {
        // Convert using JS Date parsing as local time (Temporal.TimeZone types are not available in this repo).
        // PlainDateTime string is like "2026-01-19T15:00:00" (no offset) -> Date treats it as local time.
        const pdtLike = rangePart as { toString: () => string };
        const isoLike = pdtLike.toString();
        const d = new Date(isoLike);
        if (!Number.isNaN(d.getTime())) return d.toISOString();
      } catch {
        // Fall through to string handling
      }
    }
  }
  
  // Handle bracketed timezone notation from Temporal string representation
  if (s.includes("[")) s = s.split("[")[0] ?? s;
  
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString();
  return new Date().toISOString();
}

export function buildScheduleXEvents(args: {
  mode: ScheduleXMode;
  meetings: CalendarEvent[];
  tasks: Task[];
  timeZone: string;
  visibleRange: ScheduleXRange | null;
  projectNameById?: Record<string, string | null | undefined>;
  meetingColor?: string;
}): ScheduleXEvent[] {
  const { mode, meetings, tasks, timeZone, visibleRange } = args;
  const projectNameById = args.projectNameById || {};

  function buildMeetingEvents(): ScheduleXEvent[] {
    const fallbackRange = {
      startIso: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      endIso: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    };
    const effectiveRange = visibleRange || fallbackRange;
    const rangeStart = new Date(effectiveRange.startIso);
    const rangeEnd = new Date(effectiveRange.endIso);

    return meetings.flatMap((e): ScheduleXEvent[] => {
      const safeEndIso = e.is_all_day ? e.end_at : safeTimedEnd(e.start_at, e.end_at);
      const durationMs = e.is_all_day
        ? 0
        : Math.max(60 * 1000, new Date(safeEndIso).getTime() - new Date(e.start_at).getTime());
      const { spanDays: allDaySpanDays } = e.is_all_day
        ? toAllDayPlainDateRange(e.start_at, safeEndIso, timeZone)
        : { spanDays: 1 };

      if (e.rrule) {
        try {
          const opts = RRule.parseString(e.rrule);
          // RRULE library assumes local time; use user's wall-clock components for dtstart
          const zdt = toTemporalZdt(e.start_at, timeZone);
          const dtstartLocal = new Date(
            zdt.year,
            zdt.month - 1,
            zdt.day,
            zdt.hour,
            zdt.minute,
            zdt.second
          );
          const rule = new RRule({ ...opts, dtstart: dtstartLocal });
          const occurrences = rule.between(rangeStart, rangeEnd, true);

          return occurrences.map((occ): ScheduleXEvent => {
            const occStartIso = occ.toISOString();
            const occEndIso = new Date(occ.getTime() + durationMs).toISOString();

            // Week/day views render all-day events reliably when start/end are PlainDate
            // IMPORTANT: Schedule-X treats all-day (PlainDate) `end` as INCLUSIVE, not exclusive.
            const start = e.is_all_day
              ? toPlainDateInTimeZone(occStartIso, timeZone)
              : toTemporalZdt(occStartIso, timeZone);
            const end = e.is_all_day
              ? (start as Temporal.PlainDate).add({ days: Math.max(0, allDaySpanDays - 1) })
              : toTemporalZdt(occEndIso, timeZone);

            return {
              id: `m-${e.id}-${occ.getTime()}`,
              title: e.title,
              start,
              end,
              calendarId: e.project_id || "none",
              kind: "meeting" as const,
              originalId: e.id,
            };
          });
        } catch {
          // fall through to single instance
        }
      }

      const start = e.is_all_day
        ? toPlainDateInTimeZone(e.start_at, timeZone)
        : toTemporalZdt(e.start_at, timeZone);
      const end = e.is_all_day
        ? (start as Temporal.PlainDate).add({ days: Math.max(0, allDaySpanDays - 1) })
        : toTemporalZdt(safeEndIso, timeZone);

      return [
        {
          id: `m-${e.id}`,
          title: e.title,
          start,
          end,
          calendarId: e.project_id || "none",
          kind: "meeting" as const,
          originalId: e.id,
        },
      ];
    });
  }

  function buildTaskEvents(): ScheduleXEvent[] {
    return tasks
      .filter((t) => Boolean(t.start_at || t.end_at || t.deadline))
      .map((t): ScheduleXEvent => {
        const startIso = t.start_at ?? null;
        const endIso = t.end_at ?? null;

        if (!startIso || !endIso) {
          const dayIso = t.deadline || t.start_at || new Date().toISOString();
          const dayStart = toPlainDateInTimeZone(dayIso, timeZone);
          // Schedule-X treats all-day (PlainDate) `end` as inclusive
          const dayEnd = dayStart as Temporal.PlainDate;
          const projectName = (t.project_id && projectNameById[t.project_id]) || "";
          const lastDay = new Intl.DateTimeFormat(undefined, {
            month: "short",
            day: "2-digit",
          }).format(new Date(t.end_at || t.deadline || t.start_at || new Date().toISOString()));
          return {
            id: `t-${t.id}`,
            title: [projectName, t.title, lastDay ? `by ${lastDay}` : null]
              .filter(Boolean)
              .join(" · "),
            start: dayStart,
            end: dayEnd,
            calendarId: t.project_id || "none",
            kind: "task" as const,
            originalId: t.id,
          };
        }

        const safeEndIso = safeTimedEnd(startIso, endIso);
        const projectName = (t.project_id && projectNameById[t.project_id]) || "";
        const lastDay = new Intl.DateTimeFormat(undefined, {
          month: "short",
          day: "2-digit",
        }).format(new Date(safeEndIso));
        return {
          id: `t-${t.id}`,
          title: [projectName, t.title, lastDay ? `by ${lastDay}` : null]
            .filter(Boolean)
            .join(" · "),
          start: toTemporalZdt(startIso, timeZone),
          end: toTemporalZdt(safeEndIso, timeZone),
          calendarId: t.project_id || "none",
          kind: "task" as const,
          originalId: t.id,
        };
      });
  }

  if (mode === "meetings") return buildMeetingEvents();
  if (mode === "tasks") return buildTaskEvents();
  return [...buildMeetingEvents(), ...buildTaskEvents()];
}
