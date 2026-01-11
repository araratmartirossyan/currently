<script setup lang="ts">
import { computed } from "vue";
import { differenceInCalendarDays, format, startOfDay } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/types";
import { getTaskLastDate } from "@/helpers/tasks/display";

const props = defineProps<{
  tasks: Task[];
  projectNameById: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: "edit", task: Task): void;
}>();

const items = computed(() => {
  const today = startOfDay(new Date());
  return props.tasks
    .map((t) => {
      const last = getTaskLastDate(t);
      return last ? { task: t, d: startOfDay(last) } : null;
    })
    .filter(Boolean)
    .map((t) => {
      const { task, d } = t as { task: Task; d: Date };
      const daysLeft = differenceInCalendarDays(d, today);
      return { task, d, daysLeft };
    })
    .sort((a, b) => a.d.getTime() - b.d.getTime());
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
        No tasks due in the next 3 days.
      </div>

      <div v-else class="space-y-2">
        <button
          v-for="{ task, d, daysLeft } in items"
          :key="task.id"
          class="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2 text-left hover:bg-muted/50"
          @click="emit('edit', task)"
        >
          <div class="min-w-0">
            <div class="truncate font-medium text-foreground">
              {{
                task.project_id && projectNameById[task.project_id]
                  ? `${projectNameById[task.project_id]} · `
                  : ""
              }}{{ task.title || "Untitled task" }}
            </div>
            <div class="text-xs text-muted-foreground">
              {{ format(d, "EEE, MMM dd") }}
            </div>
          </div>
          <Badge variant="outline" class="shrink-0 text-muted-foreground">
            D-{{ daysLeft }}
          </Badge>
        </button>
      </div>
    </CardContent>
  </Card>
</template>
