<script setup lang="ts">
import { computed } from "vue";
import type { CalendarEvent, Task } from "@/types";
import { useScheduleXCalendar } from "@/composables/useScheduleXCalendar";
import { useTheme } from "@/composables/useTheme";

// Schedule-X (client-only component)
// Vercel SSR can treat @schedule-x/vue as CommonJS -> named exports may fail.
// Default-import keeps it compatible for direct (SSR) page loads.
import ScheduleXVue from "@schedule-x/vue";
import "@schedule-x/theme-default/dist/index.css";
import "temporal-polyfill/global";

const ScheduleXCalendar =
  (ScheduleXVue as unknown as { ScheduleXCalendar: unknown }).ScheduleXCalendar ||
  (ScheduleXVue as unknown as { default?: { ScheduleXCalendar?: unknown } }).default?.ScheduleXCalendar;

const props = defineProps<{
  mode: "meetings" | "tasks";
  meetings: CalendarEvent[];
  tasks: Task[];
  projectColorById?: Record<string, string | null | undefined>;
  projectNameById?: Record<string, string | null | undefined>;
  meetingColor?: string;
}>();

const emit = defineEmits<{
  (e: "rangeChange", payload: { startIso: string; endIso: string }): void;
  (e: "eventClick", payload: { kind: "task" | "meeting"; id: string }): void;
  (e: "slotClick", payload: { date: Date; isAllDay: boolean }): void;
}>();

const { theme } = useTheme();
const scheduleXThemeClass = computed(() => (theme.value === "dark" ? "is-dark" : ""));

const { calendarApp } = useScheduleXCalendar({
  mode: () => props.mode,
  meetings: () => props.meetings,
  tasks: () => props.tasks,
  projectColorById: () => props.projectColorById || {},
  projectNameById: () => props.projectNameById || {},
  meetingColor: props.meetingColor,
  onRangeChange: (payload) => emit("rangeChange", payload),
  onEventClick: (payload) => emit("eventClick", payload),
  onSlotClick: (payload) => emit("slotClick", payload),
});
</script>

<template>
  <div class="sx-vue-calendar-wrapper" :class="scheduleXThemeClass">
    <ScheduleXCalendar :calendar-app="calendarApp" />
  </div>
</template>

<style scoped>
.sx-vue-calendar-wrapper {
  width: 100%;
  height: 75vh;
  max-height: 900px;
}

/* Ensure pointer cursor on Schedule-X interactive controls */
.sx-vue-calendar-wrapper :deep(button),
.sx-vue-calendar-wrapper :deep([role="button"]),
.sx-vue-calendar-wrapper :deep(a),
.sx-vue-calendar-wrapper :deep(select),
.sx-vue-calendar-wrapper :deep(input[type="checkbox"]),
.sx-vue-calendar-wrapper :deep(input[type="date"]) {
  cursor: pointer;
}
</style>
