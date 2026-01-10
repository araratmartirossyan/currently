<script setup lang="ts">
import { useTaskStore } from "@/stores/tasks";
import { useProjectStore } from "@/stores/projects";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2, Circle, Clock, FolderKanban } from "lucide-vue-next";
import { storeToRefs } from "pinia";
import { computed } from "vue";

const taskStore = useTaskStore();
const projectStore = useProjectStore();
const { tasks } = storeToRefs(taskStore);
const { projects } = storeToRefs(projectStore);

const stats = computed(() => {
  const totalTasks = tasks.value.length;
  const completedTasks = tasks.value.filter((t) => t.status === "completed").length;
  const pendingTasks = tasks.value.filter((t) => t.status === "pending").length;
  const totalProjects = projects.value.length;

  return [
    { title: "Total Tasks", value: totalTasks, icon: Clock, color: "text-blue-500" },
    { title: "Completed", value: completedTasks, icon: CheckCircle2, color: "text-green-500" },
    { title: "Pending", value: pendingTasks, icon: Circle, color: "text-yellow-500" },
    { title: "Projects", value: totalProjects, icon: FolderKanban, color: "text-purple-500" },
  ];
});
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <Card
      v-for="stat in stats"
      :key="stat.title"
      class="bg-card hover:bg-muted/50 overflow-hidden border-none shadow-sm transition-colors"
    >
      <CardHeader class="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
        <CardTitle class="text-muted-foreground text-xs font-medium tracking-wider uppercase">{{
          stat.title
        }}</CardTitle>
        <component :is="stat.icon" class="size-4" :class="stat.color" />
      </CardHeader>
      <CardContent class="p-4 pt-0">
        <div class="text-2xl font-bold tracking-tighter">{{ stat.value }}</div>
        <p class="text-muted-foreground mt-1 text-[10px]">+2.5% from last week</p>
      </CardContent>
    </Card>
  </div>
</template>
