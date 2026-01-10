<template>
  <div class="grid h-full grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-4">
    <div
      v-for="col in columns"
      :key="col.id"
      class="bg-muted/30 flex flex-col gap-4 rounded-xl border border-dashed p-3"
    >
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center gap-2">
          <div class="size-2 rounded-full" :class="statusColors[col.id]"></div>
          <h3 class="text-sm font-semibold">{{ col.title }}</h3>
        </div>
        <Badge variant="secondary" class="h-5 rounded-full px-1.5 text-[10px]">{{
          tasksByStatus[col.id]?.length || 0
        }}</Badge>
      </div>

      <draggable
        :list="tasksByStatus[col.id]"
        group="tasks"
        item-key="id"
        class="flex min-h-[150px] flex-1 flex-col gap-3"
        @change="handleMove(col.id, $event)"
      >
        <template #item="{ element: task }">
          <Card
            class="hover:border-primary/50 bg-card group cursor-grab border-none shadow-sm transition-all active:cursor-grabbing"
          >
            <CardHeader class="p-3 pb-1">
              <div class="flex items-start justify-between gap-2">
                <CardTitle
                  class="group-hover:text-primary text-[13px] leading-tight font-medium transition-colors"
                  >{{ task.title }}</CardTitle
                >
                <Badge
                  :variant="
                    task.priority === 'high' || task.priority === 'urgent'
                      ? 'destructive'
                      : 'outline'
                  "
                  class="h-4 rounded-sm px-1 text-[9px] tracking-tighter uppercase"
                >
                  {{ task.priority }}
                </Badge>
              </div>
            </CardHeader>
            <CardContent class="p-3 pt-0">
              <p
                v-if="task.description"
                class="text-muted-foreground line-clamp-2 text-[11px] leading-normal"
              >
                {{ task.description }}
              </p>
              <div v-if="task.tags?.length" class="mt-2 flex flex-wrap gap-1">
                <Badge
                  v-for="tag in task.tags"
                  :key="tag"
                  variant="secondary"
                  class="bg-muted/50 h-4 rounded-sm border-none px-1 text-[9px]"
                >
                  {{ tag }}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </template>
      </draggable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTaskStore } from "@/stores/tasks";
import draggable from "vuedraggable";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskStatus } from "@/types";
import { storeToRefs } from "pinia";

const taskStore = useTaskStore();
const { tasksByStatus } = storeToRefs(taskStore);

const columns = [
  { id: TaskStatus.PENDING, title: "Pending" },
  { id: TaskStatus.IN_PROGRESS, title: "In Progress" },
  { id: TaskStatus.COMPLETED, title: "Completed" },
  { id: TaskStatus.CANCELLED, title: "Cancelled" },
];

const statusColors: Record<string, string> = {
  [TaskStatus.PENDING]: "bg-yellow-500",
  [TaskStatus.IN_PROGRESS]: "bg-blue-500",
  [TaskStatus.COMPLETED]: "bg-green-500",
  [TaskStatus.CANCELLED]: "bg-red-500",
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const handleMove = (status: TaskStatus, event: unknown) => {
  if (!isObject(event)) return;
  const added = event["added"];
  if (!isObject(added)) return;
  const element = added["element"];
  if (!isObject(element)) return;
  const id = element["id"];
  if (typeof id !== "string") return;

  taskStore.updateTask({ id, status });
};
</script>
