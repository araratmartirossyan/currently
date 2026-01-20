<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { Maximize2, Minimize2 } from "lucide-vue-next";
import type { CalendarEvent, Task } from "@/types";
import { useScheduleXCalendar } from "@/composables/useScheduleXCalendar";
import { Button } from "@/components/ui/button";
import { buildScheduleXEvents } from "@/helpers/calendar/schedulex";

// Schedule-X (client-only component)
// Vercel SSR can treat @schedule-x/vue as CommonJS -> named exports may fail on direct loads.
// Namespace import works for both ESM + CommonJS interop.
import * as ScheduleXVue from "@schedule-x/vue";
import "@schedule-x/theme-default/dist/index.css";
import "temporal-polyfill/global";

const ScheduleXCalendar = (ScheduleXVue as unknown as { ScheduleXCalendar?: unknown })
  .ScheduleXCalendar;

const props = defineProps<{
  mode: "meetings" | "tasks" | "all";
  meetings: CalendarEvent[];
  tasks: Task[];
  projectColorById?: Record<string, string | null | undefined>;
  projectNameById?: Record<string, string | null | undefined>;
  meetingColor?: string;
  /** Show fullscreen toggle button (default: true) */
  fullscreenToggle?: boolean;
}>();

const emit = defineEmits<{
  (e: "rangeChange", payload: { startIso: string; endIso: string }): void;
  (e: "eventClick", payload: { kind: "task" | "meeting"; id: string }): void;
  (e: "slotClick", payload: { date: Date; isAllDay: boolean }): void;
  (e: "eventUpdate", payload: { kind: "task" | "meeting"; originalId: string; startIso: string; endIso: string }): void;
}>();

const colorMode = useColorMode();
const scheduleXThemeClass = computed(() => (colorMode.value === "dark" ? "is-dark" : ""));

const draggedTaskId = useState<string | null>("calendarDraggedTaskId", () => null);
const droppedTaskId = useState<string | null>("calendarDroppedTaskId", () => null);

const isFullscreen = ref(false);
const rootEl = ref<HTMLElement | null>(null);
const didAutoScroll = ref(false);
const wrapperClass = computed(() => {
  if (isFullscreen.value) {
    return "fixed inset-0 z-[120] bg-background p-3";
  }
  // bigger on large screens, but still bounded on small screens
  return "w-full";
});

const containerClass = computed(() => {
  if (isFullscreen.value) return "h-[calc(100vh-1.5rem)]";
  return "h-[75vh] max-h-[900px] lg:h-[calc(100vh-10rem)] lg:max-h-none";
});

const { calendarApp, visibleRange, timeZone } = useScheduleXCalendar({
  mode: () => props.mode,
  meetings: () => props.meetings,
  tasks: () => props.tasks,
  projectColorById: () => props.projectColorById || {},
  projectNameById: () => props.projectNameById || {},
  meetingColor: props.meetingColor,
  onRangeChange: (payload) => emit("rangeChange", payload),
  onEventClick: (payload) => emit("eventClick", payload),
  onSlotClick: (payload) => emit("slotClick", payload),
  onEventUpdate: (payload) => emit("eventUpdate", payload),
});

const upcomingTimedEventId = computed(() => {
  const range = visibleRange.value;
  const events = buildScheduleXEvents({
    mode: props.mode,
    meetings: props.meetings,
    tasks: props.tasks,
    timeZone,
    visibleRange: range,
    projectNameById: props.projectNameById || {},
    meetingColor: props.meetingColor,
  });

  const now = Temporal.Now.zonedDateTimeISO(timeZone).toInstant().epochMilliseconds;

  const upcoming = events
    .filter((e) => e.start instanceof Temporal.ZonedDateTime)
    .map((e) => ({
      id: e.id,
      startMs: (e.start as Temporal.ZonedDateTime).toInstant().epochMilliseconds,
    }))
    .filter((e) => e.startMs >= now)
    .sort((a, b) => a.startMs - b.startMs);

  return upcoming[0]?.id || null;
});

function getDraggedTaskIdFromEvent(e: DragEvent): string | null {
  const dt = e.dataTransfer;
  // Important: some browsers restrict reading `getData()` until `drop`.
  // Always prefer our shared state first, then fallback to dataTransfer.
  if (draggedTaskId.value) return draggedTaskId.value;

  const fromMime = dt?.getData("application/x-currently-task-id") || null;
  const fromText = dt?.getData("text/plain") || null;
  return (fromMime || fromText || null)?.trim() || null;
}

function onCalendarDragOver(e: DragEvent) {
  // Only allow drop when we're dragging a task from our drawer
  const hasDraggedTask = Boolean(draggedTaskId.value);
  const hasType = Boolean(
    e.dataTransfer?.types?.includes?.("application/x-currently-task-id") ||
      e.dataTransfer?.types?.includes?.("text/plain")
  );
  if (!hasDraggedTask && !hasType) return;
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
}

function onCalendarDrop(e: DragEvent) {
  const taskId = getDraggedTaskIdFromEvent(e);
  if (!taskId) return;

  e.preventDefault();
  droppedTaskId.value = taskId;
  draggedTaskId.value = null;

  // Let Schedule-X compute the slot date/time by simulating a click at the drop position.
  const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
  const click = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    clientX: e.clientX,
    clientY: e.clientY,
  });

  // Dispatch on the actual element under cursor; fall back to the calendar root.
  (target || rootEl.value)?.dispatchEvent(click);

  // If the click didn't land on a slot (e.g. on an existing event), the page won't consume the drop.
  // Clear it shortly to avoid a later unrelated click scheduling the task unexpectedly.
  window.setTimeout(() => {
    if (droppedTaskId.value === taskId) droppedTaskId.value = null;
  }, 800);
}

function tryAutoScroll() {
  if (didAutoScroll.value) return;
  const root = rootEl.value;
  if (!root) return;

  // Only makes sense for week/day (time grid). Month grid doesn't scroll vertically.
  const hasWeekGrid = Boolean(root.querySelector(".sx__week-grid"));
  if (!hasWeekGrid) return;

  // Prefer the closest upcoming event in the currently rendered range.
  const targetId = upcomingTimedEventId.value;
  if (targetId) {
    const el = root.querySelector(
      `[data-event-id="${CSS.escape(targetId)}"]`
    ) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ block: "center" });
      didAutoScroll.value = true;
      return;
    }
  }

  // Fallback: scroll to "now" indicator if present
  const nowEl = root.querySelector(
    ".sx__current-time-indicator, .sx__current-time-indicator-full-week"
  ) as HTMLElement | null;
  if (nowEl) {
    nowEl.scrollIntoView({ block: "center" });
    didAutoScroll.value = true;
  }
}

onMounted(() => {
  // Let Schedule-X render first
  setTimeout(() => tryAutoScroll(), 50);
});

watch(
  () => [
    props.mode,
    props.meetings.length,
    props.tasks.length,
    visibleRange.value?.startIso,
    visibleRange.value?.endIso,
  ],
  () => {
    // If user switches to week view after mount, DOM will change; allow one auto-scroll.
    didAutoScroll.value = false;
    setTimeout(() => tryAutoScroll(), 50);
  }
);
</script>

<template>
  <div :class="[wrapperClass, scheduleXThemeClass]" @dragover="onCalendarDragOver" @drop="onCalendarDrop">
    <div ref="rootEl" class="relative" :class="containerClass">
      <div v-if="props.fullscreenToggle !== false" class="absolute top-3 right-3 z-2">
        <Button
          variant="outline"
          size="sm"
          class="cursor-pointer gap-2"
          @click="isFullscreen = !isFullscreen"
        >
          <component :is="isFullscreen ? Minimize2 : Maximize2" class="size-4" />
          {{ isFullscreen ? "Exit" : "Fullscreen" }}
        </Button>
      </div>

      <ScheduleXCalendar :calendar-app="calendarApp" />
    </div>
  </div>
</template>

<style scoped>
/* Ensure pointer cursor on Schedule-X interactive controls */
:deep(button),
:deep([role="button"]),
:deep(a),
:deep(select),
:deep(input[type="checkbox"]),
:deep(input[type="date"]) {
  cursor: pointer;
}
</style>
