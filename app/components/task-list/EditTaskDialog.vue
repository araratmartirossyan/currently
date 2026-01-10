<script setup lang="ts">
import { reactive, watch } from "vue";
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
import type { Project, Task } from "@/types";
import { TaskStatus } from "@/types";

const props = defineProps<{
  open: boolean;
  task: Task | null;
  projects: Project[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (
    e: "save",
    payload: Pick<Task, "title" | "description" | "status" | "project_id" | "deadline">
  ): void;
}>();

const form = reactive({
  title: "",
  description: "",
  status: TaskStatus.PENDING as TaskStatus,
  project_id: "",
  deadline: "",
});

watch(
  () => props.task,
  (t) => {
    if (!t) return;
    form.title = t.title || "";
    form.description = t.description || "";
    form.status = t.status || TaskStatus.PENDING;
    form.project_id = t.project_id || "";
    form.deadline = t.deadline ? new Date(t.deadline).toISOString().slice(0, 10) : "";
  },
  { immediate: true }
);

const onSave = () => {
  emit("save", {
    title: form.title,
    description: form.description,
    status: form.status,
    project_id: form.project_id || null,
    deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
  });
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
          <Input v-model="form.title" />
        </div>
        <div class="grid gap-2">
          <label class="text-sm font-medium">Description</label>
          <Textarea v-model="form.description" rows="4" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Status</label>
            <select
              v-model="form.status"
              class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div class="grid gap-2">
            <label class="text-sm font-medium">Deadline</label>
            <Input v-model="form.deadline" type="date" />
          </div>
        </div>
        <div class="grid gap-2">
          <label class="text-sm font-medium">Project</label>
          <select
            v-model="form.project_id"
            class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <option value="">No project</option>
            <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
      </div>
      <DialogFooter class="mt-4">
        <Button variant="outline" @click="emit('close')">Cancel</Button>
        <Button @click="onSave">Save</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
