<script setup lang="ts">
import { onMounted } from "vue";
import TaskListView from "@/components/TaskListView.vue";
import { taskService, projectService } from "@/services/api";
import { useTaskStore } from "@/stores/tasks";
import { useProjectStore } from "@/stores/projects";

const taskStore = useTaskStore();
const projectStore = useProjectStore();
const config = useRuntimeConfig();

onMounted(async () => {
  try {
    const supabaseUrl = config.public?.supabaseUrl || process.env.SUPABASE_URL;
    const supabaseKey = config.public?.supabaseKey || process.env.SUPABASE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      console.warn("[supabase] Missing SUPABASE_URL / SUPABASE_KEY. Using mock data only.");
      return;
    }
    const [tasks, projects] = await Promise.all([
      taskService.getTasks(),
      projectService.getProjects(),
    ]);
    taskStore.setTasks(tasks);
    projectStore.setProjects(projects);
  } catch (e) {
    console.error("Failed to load data from Supabase", e);
  }
});
</script>

<template>
  <div class="space-y-6">
    <TaskListView />
  </div>
</template>
