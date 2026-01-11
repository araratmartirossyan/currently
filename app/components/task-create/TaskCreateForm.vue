<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { Mic, Square, Loader2, Save } from "lucide-vue-next";
import { storeToRefs } from "pinia";
import { toast } from "vue-sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useTaskStore } from "@/stores/tasks";
import { useProjectStore } from "@/stores/projects";
import { useVoiceNote } from "@/composables/useVoiceNote";
import { useTaskForm } from "@/composables/useTaskForm";
import type { TaskFormValues } from "@/composables/useTaskForm";

const props = defineProps<{
  initialStart?: Date | null;
  initialEnd?: Date | null;
}>();

const emit = defineEmits<{
  (e: "created" | "cancel"): void;
}>();

const taskStore = useTaskStore();
const projectStore = useProjectStore();
const { projects } = storeToRefs(projectStore);
const projectNames = computed(() => projects.value.map((p) => p.name));
const { isRecording, isProcessing, result, startRecording, stopRecording } = useVoiceNote({
  projectNames,
});

const {
  handleSubmit,
  resetForm,
  title,
  description,
  project_id,
  priority,
  status,
  category,
  subcategory,
  start_at,
  end_at,
  applyVoiceResult,
  toInsert,
  isValidTitle,
} = useTaskForm({
  initialValues: computed<Partial<TaskFormValues>>(() => {
    if (!props.initialStart) return {};
    const start = props.initialStart;
    const end = props.initialEnd || new Date(start.getTime() + 60 * 60 * 1000);
    return {
      start_at: new Date(start).toISOString().slice(0, 16),
      end_at: new Date(end).toISOString().slice(0, 16),
    };
  }).value,
});

onMounted(async () => {
  try {
    await projectStore.fetchProjects();
  } catch (e) {
    console.error("Failed to load projects", e);
  }
});

watch(
  result,
  (response) => {
    if (!response?.extracted) return;
    applyVoiceResult(response, projects.value);
    toast.success("Task info extracted!");
  },
  { deep: true }
);

const onSubmit = handleSubmit(async (values) => {
  try {
    await taskStore.createTask(toInsert(values));

    toast.success("Task created successfully");
    resetForm();
    emit("created");
  } catch (err) {
    console.error(err);
    toast.error("Failed to save task");
  }
});

const onCancel = () => {
  emit("cancel");
};
</script>

<template>
  <div class="space-y-6">
    <div
      class="bg-muted/30 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6"
    >
      <Button
        size="lg"
        :variant="isRecording ? 'destructive' : 'default'"
        class="flex size-16 flex-col gap-1 rounded-full"
        @click="isRecording ? stopRecording() : startRecording()"
        :disabled="isProcessing"
      >
        <component :is="isRecording ? Square : Mic" class="size-7" />
      </Button>
      <p class="mt-3 text-sm font-medium">
        {{ isRecording ? "Recording... click to stop" : "Click to start recording" }}
      </p>
      <div v-if="isProcessing" class="text-primary mt-3 flex items-center gap-2 text-sm">
        <Loader2 class="size-4 animate-spin" />
        Processing with AI...
      </div>
    </div>

    <form class="grid gap-4" @submit.prevent="onSubmit">
      <div class="grid gap-2">
        <label for="title" class="text-sm font-medium">Title</label>
        <Input id="title" v-model="title" placeholder="Task title" required />
      </div>

      <div class="grid gap-2">
        <label for="description" class="text-sm font-medium">Description</label>
        <textarea
          id="description"
          v-model="description"
          class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          placeholder="Task description"
        ></textarea>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="grid gap-2">
          <label class="text-sm font-medium">Project</label>
          <client-only>
            <Select v-model="project_id">
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                <SelectItem v-for="p in projects" :key="p.id" :value="p.id">
                  {{ p.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </client-only>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Priority</label>
          <select
            v-model="priority"
            class="border-input bg-background flex h-10 w-full cursor-pointer rounded-md border px-3 py-2 text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="grid gap-2">
          <label class="text-sm font-medium">Status</label>
          <select
            v-model="status"
            class="border-input bg-background flex h-10 w-full cursor-pointer rounded-md border px-3 py-2 text-sm"
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
          <Input type="datetime-local" v-model="start_at" />
        </div>
        <div class="grid gap-2">
          <label class="text-sm font-medium">End</label>
          <Input type="datetime-local" v-model="end_at" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="grid gap-2">
          <label class="text-sm font-medium">Category</label>
          <Input v-model="category" placeholder="e.g. Personal, Work" />
        </div>
        <div class="grid gap-2">
          <label class="text-sm font-medium">Sub-category</label>
          <Input v-model="subcategory" placeholder="e.g. Home, Finance" />
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" @click="onCancel">Cancel</Button>
        <Button type="submit" :disabled="!isValidTitle">
          <Save class="mr-2 size-4" />
          Save Task
        </Button>
      </div>
    </form>
  </div>
</template>
