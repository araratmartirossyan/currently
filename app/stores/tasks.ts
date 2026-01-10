import { defineStore } from "pinia";
import type { Task } from "@/types";
import { TaskStatus } from "@/types";

export const useTaskStore = defineStore("tasks", () => {
  const tasks = ref<Task[]>([]);
  const selectedProjectId = ref<string | null>(null);

  const filteredTasks = computed(() => {
    if (!selectedProjectId.value) return tasks.value;
    return tasks.value.filter((t) => t.project_id === selectedProjectId.value);
  });

  const tasksByStatus = computed(() => {
    const groups: Record<string, Task[]> = {
      [TaskStatus.PENDING]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.COMPLETED]: [],
      [TaskStatus.CANCELLED]: [],
    };
    filteredTasks.value.forEach((task) => {
      if (groups[task.status]) {
        groups[task.status].push(task);
      }
    });
    return groups;
  });

  function setSelectedProject(id: string | null) {
    selectedProjectId.value = id;
  }

  function setTasks(newTasks: Task[]) {
    tasks.value = newTasks;
  }

  function addTask(task: Task) {
    tasks.value.push(task);
  }

  function updateTask(updatedTask: Partial<Task> & { id: string }) {
    const index = tasks.value.findIndex((t) => t.id === updatedTask.id);
    if (index !== -1) {
      tasks.value[index] = { ...tasks.value[index], ...updatedTask };
    }
  }

  function deleteTask(id: string) {
    tasks.value = tasks.value.filter((t) => t.id !== id);
  }

  return {
    tasks,
    selectedProjectId,
    filteredTasks,
    tasksByStatus,
    setSelectedProject,
    setTasks,
    addTask,
    updateTask,
    deleteTask,
  };
});
