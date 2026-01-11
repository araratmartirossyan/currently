import { computed, ref, shallowRef, watch } from "vue";
import {
  createCalendar,
  createViewDay,
  createViewMonthAgenda,
  createViewMonthGrid,
  createViewWeek,
} from "@schedule-x/calendar";
import { createEventsServicePlugin } from "@schedule-x/events-service";
import { createCalendarControlsPlugin } from "@schedule-x/calendar-controls";
import type { CalendarEvent, Task } from "@/types";
import {
  buildScheduleXEvents,
  getUserTimeZone,
  rangePartToIso,
  type ScheduleXEvent,
  type ScheduleXRange,
} from "@/helpers/calendar/schedulex";

export function useScheduleXCalendar(args: {
  mode: () => "meetings" | "tasks";
  meetings: () => CalendarEvent[];
  tasks: () => Task[];
  projectColorById?: () => Record<string, string | null | undefined>;
  projectNameById?: () => Record<string, string | null | undefined>;
  meetingColor?: string;
  onRangeChange: (payload: ScheduleXRange) => void;
  onEventClick: (payload: { kind: "task" | "meeting"; id: string }) => void;
  onSlotClick?: (payload: { date: Date; isAllDay: boolean }) => void;
}) {
  const timeZone = getUserTimeZone();
  // Fallback range so recurring events appear even if a view doesn't fire onRangeUpdate immediately
  const visibleRange = ref<ScheduleXRange | null>({
    startIso: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    endIso: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  });

  const eventsService = createEventsServicePlugin();
  const calendarControls = createCalendarControlsPlugin();

  type CalendarControls = {
    setView?: (viewName: string) => void;
    getView?: () => string;
  };

  const controls = calendarControls as unknown as CalendarControls;

  function startOfDayIso(date: Temporal.PlainDate) {
    return date
      .toZonedDateTime({ timeZone, plainTime: Temporal.PlainTime.from("00:00") })
      .toInstant()
      .toString();
  }

  function updateRangeAroundSelectedDate(date: Temporal.PlainDate) {
    // Some Schedule-X navigation paths don't fire onRangeUpdate reliably (esp. week/day switching).
    // Keep a wide range so recurring events can always be expanded for the visible period.
    const start = date.subtract({ days: 14 });
    const endExclusive = date.add({ days: 60 }).add({ days: 1 }); // include full last day
    const payload = { startIso: startOfDayIso(start), endIso: startOfDayIso(endExclusive) };
    visibleRange.value = payload;
    args.onRangeChange(payload);
  }

  function hashToHex(key: string) {
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    const r = (h & 0xff0000) >> 16;
    const g = (h & 0x00ff00) >> 8;
    const b = h & 0x0000ff;
    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  function lighten(hex: string, amount: number) {
    const h = hex.replace("#", "");
    if (h.length !== 6) return hex;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const mix = (c: number) => Math.round(c + (255 - c) * amount);
    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
  }

  const calendars = computed(() => {
    const colors = args.projectColorById?.() || {};
    const meetingBase = args.meetingColor || "#7c3aed";

    const out: Record<
      string,
      {
        colorName: string;
        lightColors: { main: string; container: string; onContainer: string };
        darkColors: { main: string; container: string; onContainer: string };
      }
    > = {};

    // default fallback
    out.none = {
      colorName: "none",
      lightColors: {
        main: meetingBase.startsWith("#") ? meetingBase : "#7c3aed",
        container: "#ede9fe",
        onContainer: "#2e1065",
      },
      darkColors: {
        main: "#c4b5fd",
        container: "#2e1065",
        onContainer: "#ede9fe",
      },
    };

    for (const [projectId, color] of Object.entries(colors)) {
      const main = (color && color.startsWith("#") ? color : null) || hashToHex(projectId);
      const container = lighten(main, 0.85);
      out[projectId] = {
        colorName: `p${hashToHex(projectId).replace("#", "")}`,
        lightColors: { main, container, onContainer: "#111827" },
        darkColors: { main, container: "#111827", onContainer: "#f9fafb" },
      };
    }

    return out;
  });

  const sxEvents = computed<ScheduleXEvent[]>(() =>
    buildScheduleXEvents({
      mode: args.mode(),
      meetings: args.meetings(),
      tasks: args.tasks(),
      timeZone,
      visibleRange: visibleRange.value,
      projectNameById: args.projectNameById?.(),
      meetingColor: args.meetingColor,
    })
  );

  const calendarApp = shallowRef(
    createCalendar({
      selectedDate: Temporal.Now.plainDateISO(timeZone),
      timezone: timeZone,
      // Default view is the first one in the array (Month grid)
      views: [createViewMonthGrid(), createViewWeek(), createViewDay(), createViewMonthAgenda()],
      calendars: calendars.value,
      events: sxEvents.value, // Fixed: use properly typed computed array
      callbacks: {
        onRangeUpdate(range: { start: unknown; end: unknown }) {
          const startIso = rangePartToIso(range.start);
          const endIso = rangePartToIso(range.end);
          const payload = { startIso, endIso };
          visibleRange.value = payload;
          args.onRangeChange(payload);
        },
        onSelectedDateUpdate(date: Temporal.PlainDate) {
          updateRangeAroundSelectedDate(date);
        },
        onClickDateTime(dateTime: unknown) {
          if (!args.onSlotClick) return;
          const iso = rangePartToIso(dateTime);
          args.onSlotClick({ date: new Date(iso), isAllDay: false });
        },
        onClickDate(date: unknown) {
          if (!args.onSlotClick) return;
          const iso = rangePartToIso(date);
          args.onSlotClick({ date: new Date(iso), isAllDay: true });
        },
        onClickAgendaDate(date: unknown) {
          if (!args.onSlotClick) return;
          const iso = rangePartToIso(date);
          args.onSlotClick({ date: new Date(iso), isAllDay: true });
        },
        onEventClick(calendarEvent: unknown) {
          if (typeof calendarEvent !== "object" || calendarEvent === null) return;
          const e = calendarEvent as Record<string, unknown>;
          const kind = e.kind;
          const originalId = e.originalId;
          if (kind !== "task" && kind !== "meeting") return;
          if (typeof originalId !== "string") return;
          args.onEventClick({ kind, id: originalId });
        },
      },
      plugins: [eventsService, calendarControls],
    })
  );

  // If calendars change (e.g. projects loaded), recreate calendar so colors apply.
  watch(
    calendars,
    (next) => {
      // preserve current view if possible
      let currentView: string | null = null;
      try {
        currentView = controls.getView?.() || null;
      } catch {
        currentView = null;
      }

      calendarApp.value = createCalendar({
        selectedDate: Temporal.Now.plainDateISO(timeZone),
        timezone: timeZone,
        views: [createViewMonthGrid(), createViewWeek(), createViewDay(), createViewMonthAgenda()],
        calendars: next,
        events: sxEvents.value,
        callbacks: {
          onRangeUpdate(range: { start: unknown; end: unknown }) {
            const startIso = rangePartToIso(range.start);
            const endIso = rangePartToIso(range.end);
            const payload = { startIso, endIso };
            visibleRange.value = payload;
            args.onRangeChange(payload);
          },
          onSelectedDateUpdate(date: Temporal.PlainDate) {
            updateRangeAroundSelectedDate(date);
          },
          onClickDateTime(dateTime: unknown) {
            if (!args.onSlotClick) return;
            const iso = rangePartToIso(dateTime);
            args.onSlotClick({ date: new Date(iso), isAllDay: false });
          },
          onClickDate(date: unknown) {
            if (!args.onSlotClick) return;
            const iso = rangePartToIso(date);
            args.onSlotClick({ date: new Date(iso), isAllDay: true });
          },
          onClickAgendaDate(date: unknown) {
            if (!args.onSlotClick) return;
            const iso = rangePartToIso(date);
            args.onSlotClick({ date: new Date(iso), isAllDay: true });
          },
          onEventClick(calendarEvent: unknown) {
            if (typeof calendarEvent !== "object" || calendarEvent === null) return;
            const e = calendarEvent as Record<string, unknown>;
            const kind = e.kind;
            const originalId = e.originalId;
            if (kind !== "task" && kind !== "meeting") return;
            if (typeof originalId !== "string") return;
            args.onEventClick({ kind, id: originalId });
          },
        },
        plugins: [eventsService, calendarControls],
      });

      // restore view or force month grid
      setTimeout(() => {
        try {
          controls.setView?.(currentView || "monthGrid");
        } catch {
          // ignore
        }
      }, 0);
    },
    { deep: true }
  );

  watch(
    sxEvents,
    (next) => {
      eventsService.set(next);
    },
    { immediate: true }
  );

  return {
    calendarApp,
    timeZone,
    calendarControls: controls,
  };
}
