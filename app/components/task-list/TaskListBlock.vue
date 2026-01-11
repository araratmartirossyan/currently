<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { Task } from "@/types";
import { formatTaskLastDay } from "@/helpers/tasks/display";

const props = defineProps<{
  todayList: Task[];
  upcomingList: Task[];
  statusColors: Record<string, string>;
  projectNameById: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: "toggle" | "edit", task: Task): void;
}>();
</script>

<template>
  <Card class="shadow-sm">
    <CardContent class="p-0">
      <div class="divide-y">
        <div
          v-for="task in todayList"
          :key="task.id"
          class="flex cursor-pointer items-center gap-3 px-5 py-4 hover:bg-slate-50/80"
          @click="emit('edit', task)"
        >
          <Checkbox
            class="mt-1"
            :checked="task.status === 'completed'"
            @update:checked.stop="() => emit('toggle', task)"
          />
          <div class="flex-1 space-y-1">
            <div class="flex items-center gap-2">
              <p class="leading-tight font-medium text-slate-900">
                {{ task.title || "Untitled task" }}
              </p>
              <Badge
                v-if="task.project_id"
                variant="outline"
                class="border-slate-200 text-slate-500"
              >
                {{ props.projectNameById[task.project_id] || "Project" }}
              </Badge>
            </div>
            <p class="line-clamp-2 text-sm text-slate-500">
              {{ task.description || "No description provided." }}
            </p>
            <p v-if="formatTaskLastDay(task)" class="text-xs text-slate-400">
              Last day: {{ formatTaskLastDay(task) }}
            </p>
          </div>
          <Badge
            variant="outline"
            :class="statusColors[task.status] || 'border-slate-200 bg-slate-100 text-slate-600'"
          >
            {{ task.status?.replace("_", " ") || "pending" }}
          </Badge>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
