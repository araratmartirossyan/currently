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
          class="flex cursor-pointer items-center gap-3 px-5 py-4 hover:bg-muted/40"
          @click="emit('edit', task)"
        >
          <Checkbox
            class="mt-1"
            :checked="task.status === 'completed'"
            @update:checked.stop="() => emit('toggle', task)"
          />
          <div class="flex-1">
            <p class="leading-tight font-medium text-foreground">
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
          <Badge
            variant="outline"
            :class="statusColors[task.status] || 'bg-muted text-muted-foreground'"
          >
            {{ task.status?.replace("_", " ") || "pending" }}
          </Badge>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
