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
            @update:checked.stop="() => emit('toggle', task)"
          />
          <div class="flex-1">
            <p class="text-sm font-medium leading-tight text-foreground sm:text-base">
              {{ task.title || "Untitled task" }}
            </p>
            <div class="text-xs text-muted-foreground sm:text-sm">
              <span v-if="task.project_id">{{
                props.projectNameById[task.project_id] || "Project"
              }}</span>
              <span v-if="task.project_id && formatTaskLastDay(task)"> · </span>
              <span v-if="formatTaskLastDay(task)">Last day {{ formatTaskLastDay(task) }}</span>
            </div>
          </div>
          <Badge
            variant="outline"
            :class="[
              statusColors[task.status] || 'bg-muted text-muted-foreground',
              'shrink-0 text-[10px] sm:text-xs self-start mt-0.5 sm:mt-0',
            ]"
          >
            {{ task.status?.replace("_", " ") || "pending" }}
          </Badge>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
