<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Mic, Square, Loader2, Save } from "lucide-vue-next";
import { useForm, useField } from "vee-validate";
import * as yup from "yup";
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

import { aiService } from "@/services/ai";
import { taskService, projectService } from "@/services/api";
import { useTaskStore } from "@/stores/tasks";
import { useProjectStore } from "@/stores/projects";
import type { Task, TaskPriority, TaskStatus } from "@/types";

type VoiceNoteResponse = {
  text?: string;
  extracted?: {
    title?: string;
    description?: string;
    project?: string;
    priority?: TaskPriority;
    tags?: string[];
    deadline?: string | null;
  };
};

const emit = defineEmits<{
  (e: "created" | "cancel"): void;
}>();

const taskStore = useTaskStore();
const projectStore = useProjectStore();
const { projects } = storeToRefs(projectStore);

const isRecording = ref(false);
const isProcessing = ref(false);
const mediaRecorder = ref<MediaRecorder | null>(null);
const audioChunks = ref<Blob[]>([]);

type FormValues = {
  title: string;
  description: string;
  project_id: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  category: string;
  subcategory: string;
  deadline: string;
};

const schema = yup.object({
  title: yup.string().required("Title is required"),
  description: yup.string().optional(),
  project_id: yup.string().optional(),
  priority: yup
    .mixed<"low" | "medium" | "high" | "urgent">()
    .oneOf(["low", "medium", "high", "urgent"])
    .required(),
  status: yup
    .mixed<"pending" | "in_progress" | "completed" | "cancelled">()
    .oneOf(["pending", "in_progress", "completed", "cancelled"])
    .required(),
  category: yup.string().optional(),
  subcategory: yup.string().optional(),
  deadline: yup.string().optional(),
});

const { handleSubmit, setValues, resetForm } = useForm<FormValues>({
  validationSchema: schema,
  initialValues: {
    title: "",
    description: "",
    project_id: "none",
    priority: "medium",
    status: "pending",
    category: "",
    subcategory: "",
    deadline: "",
  },
});

const { value: title } = useField<string>("title");
const { value: description } = useField<string>("description");
const { value: project_id } = useField<string>("project_id");
const { value: priority } = useField<"low" | "medium" | "high" | "urgent">("priority");
const { value: status } = useField<"pending" | "in_progress" | "completed" | "cancelled">("status");
const { value: category } = useField<string>("category");
const { value: subcategory } = useField<string>("subcategory");
const { value: deadline } = useField<string>("deadline");

onMounted(async () => {
  try {
    const data = await projectService.getProjects();
    projectStore.setProjects(data);
  } catch (e) {
    console.error("Failed to load projects", e);
  }
});

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.value = new MediaRecorder(stream);
    audioChunks.value = [];

    mediaRecorder.value.ondataavailable = (event) => {
      audioChunks.value.push(event.data);
    };

    mediaRecorder.value.onstop = async () => {
      const audioBlob = new Blob(audioChunks.value, { type: "audio/webm" });
      const file = new File([audioBlob], "recording.webm", {
        type: "audio/webm",
      });
      await processAudio(file);
    };

    mediaRecorder.value.start();
    isRecording.value = true;
  } catch (err) {
    console.error("Error accessing microphone", err);
    toast.error("Could not access microphone");
  }
};

const stopRecording = () => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop();
    isRecording.value = false;
    mediaRecorder.value.stream.getTracks().forEach((track) => track.stop());
  }
};

const processAudio = async (file: File) => {
  isProcessing.value = true;
  try {
    toast.info("Processing voice note...");
    const projectNames = projects.value.map((p) => p.name);
    const response = (await aiService.processVoiceNote(file, projectNames)) as VoiceNoteResponse;

    if (response?.extracted) {
      const matched = response.extracted.project
        ? projects.value.find(
            (p) => p.name.toLowerCase() === String(response.extracted?.project).toLowerCase()
          )
        : null;

      const transcript = response.text || "";
      const descFromAi = response.extracted.description || "";
      const descriptionValue =
        !descFromAi || descFromAi.length < Math.max(40, transcript.length * 0.6)
          ? transcript || descFromAi
          : descFromAi;

      setValues({
        title: response.extracted.title || title.value,
        description: descriptionValue || description.value,
        project_id: matched ? matched.id : project_id.value,
        priority: (response.extracted.priority as TaskPriority) || priority.value,
        status: status.value,
        category: category.value || "",
        subcategory: subcategory.value || "",
        deadline: deadline.value || "",
      });

      toast.success("Task info extracted!");
    }
  } catch (err) {
    console.error("AI processing failed", err);
    toast.error("Failed to process voice note");
  } finally {
    isProcessing.value = false;
  }
};

const onSubmit = handleSubmit(async (values) => {
  try {
    const projectId = values.project_id === "none" ? null : values.project_id;
    const payload: Partial<Task> = {
      title: values.title,
      description: values.description || null,
      project_id: projectId,
      category: values.category?.trim() ? values.category.trim() : null,
      subcategory: values.subcategory?.trim() ? values.subcategory.trim() : null,
      deadline: values.deadline ? new Date(values.deadline).toISOString() : null,
      priority: values.priority as TaskPriority,
      status: values.status as TaskStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attachments: [],
    };

    const saved = await taskService.createTask(payload);
    taskStore.addTask(saved);

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
            class="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
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
            class="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div class="grid gap-2">
          <label class="text-sm font-medium">Deadline</label>
          <Input type="date" v-model="deadline" />
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
        <Button type="submit" :disabled="!title">
          <Save class="mr-2 size-4" />
          Save Task
        </Button>
      </div>
    </form>
  </div>
</template>
