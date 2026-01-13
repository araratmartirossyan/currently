<script setup lang="ts">
import { computed } from "vue";
import { differenceInCalendarDays, format, startOfDay } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Task, CalendarEvent } from "@/types";
import { getTaskLastDate } from "@/helpers/tasks/display";
import { getEventStartDate } from "@/helpers/calendar/display";

type UpcomingItem = {
  type: "task" | "meeting";
  id: string;
  title: string;
  projectName?: string;
  date: Date;
  daysLeft: number;
  task?: Task;
  meeting?: CalendarEvent;
};

const props = defineProps<{
  tasks: Task[];
  meetings: CalendarEvent[];
  projectNameById: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: "editTask", task: Task): void;
  (e: "editMeeting", meeting: CalendarEvent): void;
}>();

const items = computed<UpcomingItem[]>(() => {
  const today = startOfDay(new Date());
  const result: UpcomingItem[] = [];

  // Add tasks
  props.tasks.forEach((task) => {
    const lastDate = getTaskLastDate(task);
    if (!lastDate) return;

    const d = startOfDay(lastDate);
    const daysLeft = differenceInCalendarDays(d, today);

    result.push({
      type: "task",
      id: task.id,
      title: task.title || "Untitled task",
      projectName: task.project_id ? props.projectNameById[task.project_id] : undefined,
      date: d,
      daysLeft,
      task,
    });
  });

  // Add meetings
  props.meetings.forEach((meeting) => {
    const startDate = getEventStartDate(meeting);
    if (!startDate) return;

    const d = startOfDay(startDate);
    const daysLeft = differenceInCalendarDays(d, today);

    result.push({
      type: "meeting",
      id: meeting.id,
      title: meeting.title || "Untitled meeting",
      projectName: meeting.project_id ? props.projectNameById[meeting.project_id] : undefined,
      date: startDate, // Keep full datetime for meetings
      daysLeft,
      meeting,
    });
  });

  // Sort by date
  return result.sort((a, b) => a.date.getTime() - b.date.getTime());
});
</script>

<template>
  <Card class="shadow-sm">
    <CardContent class="p-4">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-xl font-semibold">Upcoming Events</h3>
        <span class="text-muted-foreground text-xs">next 3 days</span>
      </div>

      <div v-if="!items.length" class="text-sm text-muted-foreground">
        No tasks or meetings in the next 3 days.
      </div>

      <div v-else class="space-y-2">
        <button
          v-for="item in items"
          :key="`${item.type}-${item.id}`"
          class="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2 text-left hover:bg-muted/50"
          @click="
            item.type === 'task' && item.task
              ? emit('editTask', item.task)
              : item.meeting
                ? emit('editMeeting', item.meeting)
                : null
          "
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <Badge
                variant="secondary"
                :class="
                  item.type === 'meeting'
                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                "
                class="shrink-0 text-xs"
              >
                {{ item.type === "meeting" ? "Meeting" : "Task" }}
              </Badge>
              <div class="truncate font-medium text-foreground">
                {{ item.projectName ? `${item.projectName} · ` : "" }}{{ item.title }}
              </div>
            </div>
            <div class="text-xs text-muted-foreground mt-1">
              {{
                item.type === "meeting"
                  ? format(item.date, "EEE, MMM dd · h:mm a")
                  : format(item.date, "EEE, MMM dd")
              }}
            </div>
          </div>
          <Badge variant="outline" class="shrink-0 text-muted-foreground">
            D-{{ item.daysLeft }}
          </Badge>
        </button>
      </div>
    </CardContent>
  </Card>
</template>
