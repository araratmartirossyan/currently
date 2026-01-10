<script setup lang="ts">
import { onMounted } from "vue";
import TaskListView from "@/components/TaskListView.vue";
import { useTaskStore } from "@/stores/tasks";
import { useProjectStore } from "@/stores/projects";

const taskStore = useTaskStore();
const projectStore = useProjectStore();

onMounted(async () => {
  try {
    await Promise.all([taskStore.fetchTasks(), projectStore.fetchProjects()]);
  } catch (e) {
    console.error("Failed to load data from Supabase", e);
  }
});
</script>

<template>
  <div class="h-full min-h-0">
    <TaskListView />
  </div>
</template>
