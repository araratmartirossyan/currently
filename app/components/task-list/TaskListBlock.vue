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
          class="hover:bg-muted/40 flex cursor-pointer items-start gap-2 px-3 py-3 sm:gap-3 sm:px-5 sm:py-4"
          @click="emit('edit', task)"
        >
          <Checkbox
            class="mt-0.5 sm:mt-1"
            :checked="task.status === 'completed'"
            @update:checked="() => emit('toggle', task)"
          />
          
          <!-- Mobile Layout -->
          <div class="flex-1 space-y-0.5 sm:hidden">
            <p class="text-foreground text-sm font-medium leading-tight">
              {{ task.title || "Untitled task" }}
            </p>
            <p class="line-clamp-2 text-xs text-slate-500">
              {{ task.description || "No description provided." }}
            </p>
            <p v-if="formatTaskLastDay(task)" class="text-[10px] text-slate-400">
              Last day: {{ formatTaskLastDay(task) }}
            </p>
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <Badge
                v-if="task.project_id"
                variant="outline"
                class="border-slate-200 text-slate-500 shrink-0 text-[10px]"
              >
                {{ props.projectNameById[task.project_id] || "Project" }}
              </Badge>
              <Badge
                variant="outline"
                :class="[
                  statusColors[task.status] || 'border-slate-200 bg-slate-100 text-slate-600',
                  'shrink-0 text-[10px]',
                ]"
              >
                {{ task.status?.replace("_", " ") || "pending" }}
              </Badge>
            </div>
          </div>

          <!-- Desktop Layout -->
          <div class="hidden flex-1 space-y-1 sm:block">
            <div class="flex flex-wrap items-center gap-2">
              <p class="text-foreground font-medium leading-tight">
                {{ task.title || "Untitled task" }}
              </p>
              <Badge
                v-if="task.project_id"
                variant="outline"
                class="border-slate-200 text-slate-500 shrink-0 text-xs"
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

          <!-- Desktop Status Badge -->
          <Badge
            variant="outline"
            :class="[
              statusColors[task.status] || 'border-slate-200 bg-slate-100 text-slate-600',
              'hidden shrink-0 text-xs self-start mt-0 sm:block',
            ]"
          >
            {{ task.status?.replace("_", " ") || "pending" }}
          </Badge>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
