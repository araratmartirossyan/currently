<script setup lang="ts">
import { computed, ref } from "vue";
import type { Task } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const props = defineProps<{
  tasks: Task[];
  projectNameById: Record<string, string | null | undefined>;
}>();

const emit = defineEmits<{
  (e: "edit", task: Task): void;
}>();

const draggedTaskId = useState<string | null>("calendarDraggedTaskId", () => null);
// Separate flag for UI "ghosting" – set AFTER dragstart to avoid cancelling drag.
const isDraggingTask = useState<boolean>("calendarIsDraggingTask", () => false);
const isDragging = ref(false);

const sortedTasks = computed(() => {
  // Keep things stable but prioritize unscheduled tasks at top
  return [...props.tasks].sort((a, b) => {
    const aHasTime = Boolean(a.start_at && a.end_at);
    const bHasTime = Boolean(b.start_at && b.end_at);
    if (aHasTime !== bHasTime) return aHasTime ? 1 : -1;
    return b.updated_at.localeCompare(a.updated_at);
  });
});

function onDragStart(e: DragEvent, task: Task) {
  isDragging.value = true;
  draggedTaskId.value = task.id;
  // Defer to next tick so the DOM doesn't change mid-dragstart.
  window.setTimeout(() => {
    isDraggingTask.value = true;
  }, 0);
  e.dataTransfer?.setData("application/x-currently-task-id", task.id);
  e.dataTransfer?.setData("text/plain", task.id);
  e.dataTransfer?.setDragImage?.((e.currentTarget as Element) || new Image(), 0, 0);
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
}

function onDragEnd() {
  draggedTaskId.value = null;
  isDraggingTask.value = false;
  // click can still fire after dragend; debounce it
  window.setTimeout(() => {
    isDragging.value = false;
  }, 50);
}

function onClick(task: Task) {
  if (isDragging.value) return;
  emit("edit", task);
}
</script>

<template>
  <Card class="shadow-sm">
    <CardContent class="p-0">
      <div v-if="!sortedTasks.length" class="p-6 text-sm text-muted-foreground">
        No tasks to show.
      </div>

      <div v-else class="divide-y">
        <div
          v-for="task in sortedTasks"
          :key="task.id"
          class="hover:bg-muted/40 flex cursor-grab items-start gap-3 px-5 py-4 active:cursor-grabbing"
          draggable="true"
          @dragstart="(e) => onDragStart(e as DragEvent, task)"
          @dragend="onDragEnd"
          @click="onClick(task)"
        >
          <div class="min-w-0 flex-1 space-y-1">
            <div class="flex items-center gap-2">
              <p class="text-foreground leading-tight font-medium">
                {{ task.title || "Untitled task" }}
              </p>
              <Badge
                v-if="task.project_id"
                variant="outline"
                class="border-slate-200 text-slate-500"
              >
                {{ props.projectNameById[task.project_id] || "Project" }}
              </Badge>
              <Badge v-if="task.start_at && task.end_at" variant="outline" class="text-slate-500">
                Scheduled
              </Badge>
            </div>

            <p v-if="task.description" class="line-clamp-2 text-sm text-slate-500">
              {{ task.description }}
            </p>
            <p v-else class="text-sm text-slate-400">Drag onto the calendar to schedule (30 min).</p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

