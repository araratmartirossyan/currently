<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { Task } from "@/types";
import { formatTaskLastDay } from "@/helpers/tasks/display";

const props = defineProps<{
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
          v-for="task in upcomingList"
          :key="task.id + '-upcoming'"
          class="flex cursor-pointer items-start gap-2 px-3 py-3 hover:bg-muted/40 sm:gap-3 sm:px-5 sm:py-4"
          @click="emit('edit', task)"
        >
          <Checkbox
            class="mt-0.5 sm:mt-1"
            :checked="task.status === 'completed'"
            @update:checked="() => emit('toggle', task)"
          />
          
          <!-- Mobile Layout -->
          <div class="flex-1 sm:hidden">
            <p class="text-sm font-medium leading-tight text-foreground">
              {{ task.title || "Untitled task" }}
            </p>
            <div class="text-xs text-muted-foreground">
              <span v-if="formatTaskLastDay(task)">Last day {{ formatTaskLastDay(task) }}</span>
            </div>
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
                  statusColors[task.status] || 'bg-muted text-muted-foreground',
                  'shrink-0 text-[10px]',
                ]"
              >
                {{ task.status?.replace("_", " ") || "pending" }}
              </Badge>
            </div>
          </div>

          <!-- Desktop Layout -->
          <div class="hidden flex-1 sm:block">
            <p class="font-medium leading-tight text-foreground">
              {{ task.title || "Untitled task" }}
            </p>
            <div class="text-sm text-muted-foreground">
              <span v-if="task.project_id">{{
                props.projectNameById[task.project_id] || "Project"
              }}</span>
              <span v-if="task.project_id && formatTaskLastDay(task)"> · </span>
              <span v-if="formatTaskLastDay(task)">Last day {{ formatTaskLastDay(task) }}</span>
            </div>
          </div>

          <!-- Desktop Status Badge -->
          <Badge
            variant="outline"
            :class="[
              statusColors[task.status] || 'bg-muted text-muted-foreground',
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
