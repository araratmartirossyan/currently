<script setup lang="ts">
import { computed } from "vue";
import { differenceInCalendarDays, format, startOfDay } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/types";

const props = defineProps<{
  tasks: Task[];
}>();

const emit = defineEmits<{
  (e: "edit", task: Task): void;
}>();

const items = computed(() => {
  const today = startOfDay(new Date());
  return props.tasks
    .filter((t) => Boolean(t.deadline))
    .map((t) => {
      const d = startOfDay(new Date(t.deadline as string));
      const daysLeft = differenceInCalendarDays(d, today);
      return { task: t, d, daysLeft };
    })
    .sort((a, b) => a.d.getTime() - b.d.getTime());
});
</script>

<template>
  <Card class="border-none shadow-sm">
    <CardContent class="p-4">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-xl font-semibold">Upcoming Events</h3>
        <span class="text-muted-foreground text-xs">next 3 days</span>
      </div>

      <div v-if="!items.length" class="text-sm text-slate-500">
        No tasks due in the next 3 days.
      </div>

      <div v-else class="space-y-2">
        <button
          v-for="{ task, d, daysLeft } in items"
          :key="task.id"
          class="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border border-slate-200 bg-white/70 px-3 py-2 text-left hover:bg-white"
          @click="emit('edit', task)"
        >
          <div class="min-w-0">
            <div class="truncate font-medium text-slate-900">
              {{ task.title || "Untitled task" }}
            </div>
            <div class="text-xs text-slate-500">
              {{ format(d, "EEE, MMM dd") }}
            </div>
          </div>
          <Badge variant="outline" class="shrink-0 border-slate-200 text-slate-600">
            D-{{ daysLeft }}
          </Badge>
        </button>
      </div>
    </CardContent>
  </Card>
</template>
