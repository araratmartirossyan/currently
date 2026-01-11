<script setup lang="ts">
import { computed, watch } from "vue";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TaskPriority, TaskStatus, type Project, type Task } from "@/types";
import { useTaskForm } from "@/composables/useTaskForm";

const props = defineProps<{
  open: boolean;
  task: Task | null;
  projects: Project[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (
    e: "save",
    payload: Pick<Task, "title" | "description" | "status" | "project_id" | "start_at" | "end_at">
  ): void;
  (e: "delete", id: string): void;
}>();

const initial = computed(() => {
  const t = props.task;
  return {
    title: t?.title ?? "",
    description: t?.description ?? "",
    status: t?.status ?? TaskStatus.PENDING,
    project_id: t?.project_id ?? "none",
    category: "",
    subcategory: "",
    priority: TaskPriority.MEDIUM,
    start_at: t?.start_at ? new Date(t.start_at).toISOString().slice(0, 16) : "",
    end_at: t?.end_at ? new Date(t.end_at).toISOString().slice(0, 16) : "",
  };
});

const {
  handleSubmit,
  setValues,
  title,
  description,
  status,
  project_id,
  start_at,
  end_at,
  toUpdate,
} = useTaskForm({
  initialValues: initial.value,
});

watch(
  () => props.task,
  (t) => {
    if (!t) return;
    setValues({
      title: t.title ?? "",
      description: t.description ?? "",
      status: t.status,
      project_id: t.project_id ?? "none",
      start_at: t.start_at ? new Date(t.start_at).toISOString().slice(0, 16) : "",
      end_at: t.end_at ? new Date(t.end_at).toISOString().slice(0, 16) : "",
    });
  },
  { immediate: true }
);

const onSave = handleSubmit((values) => {
  const update = toUpdate(values);
  emit("save", {
    title: values.title,
    description: values.description || null,
    status: values.status,
    project_id: update.project_id ?? null,
    start_at: update.start_at ?? null,
    end_at: update.end_at ?? null,
  });
});

const onDelete = () => {
  if (!props.task?.id) return;
  const ok = confirm("Delete this task? This cannot be undone.");
  if (!ok) return;
  emit("delete", props.task.id);
};
</script>

<template>
  <Dialog
    :open="open"
    @update:open="
      (val) => {
        if (!val) emit('close');
      }
    "
  >
    <DialogContent class="sm:max-w-[520px]">
      <DialogHeader>
        <DialogTitle>Edit Task</DialogTitle>
      </DialogHeader>
      <div class="space-y-4">
        <div class="grid gap-2">
          <label class="text-sm font-medium">Title</label>
          <Input v-model="title" />
        </div>
        <div class="grid gap-2">
          <label class="text-sm font-medium">Description</label>
          <Textarea v-model="description" rows="4" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Status</label>
            <select
              v-model="status"
              class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full cursor-pointer rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Start</label>
            <Input v-model="start_at" type="datetime-local" />
          </div>
          <div class="grid gap-2">
            <label class="text-sm font-medium">End</label>
            <Input v-model="end_at" type="datetime-local" />
          </div>
        </div>
        <div class="grid gap-2">
          <label class="text-sm font-medium">Project</label>
          <select
            v-model="project_id"
            class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full cursor-pointer rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <option value="none">No project</option>
            <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
      </div>
      <DialogFooter class="mt-4">
        <Button variant="destructive" @click="onDelete">Delete</Button>
        <Button variant="outline" @click="emit('close')">Cancel</Button>
        <Button @click="onSave">Save</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
