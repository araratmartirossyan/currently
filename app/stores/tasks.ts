import { defineStore } from "pinia";
import type { Task } from "@/types";
import { TaskStatus } from "@/types";
import { taskService } from "@/services/api";
import type { Database } from "~/types/database.types";

export const useTaskStore = defineStore("tasks", () => {
  const tasks = ref<Task[]>([]);
  const selectedProjectId = ref<string | null>(null);

  const filteredTasks = computed(() => {
    const active = tasks.value.filter((t) => t.status !== TaskStatus.COMPLETED);
    if (!selectedProjectId.value) return active;
    return active.filter((t) => t.project_id === selectedProjectId.value);
  });

  const tasksByStatus = computed(() => {
    const groups: Record<TaskStatus, Task[]> = {
      [TaskStatus.PENDING]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.COMPLETED]: [],
      [TaskStatus.CANCELLED]: [],
    };
    filteredTasks.value.forEach((task) => {
      groups[task.status].push(task);
    });
    return groups;
  });

  function setSelectedProject(id: string | null) {
    selectedProjectId.value = id;
  }

  function setTasks(newTasks: Task[]) {
    tasks.value = newTasks;
  }

  function updateTask(updatedTask: Partial<Task> & { id: string }) {
    const index = tasks.value.findIndex((t) => t.id === updatedTask.id);
    if (index !== -1) {
      const prev = tasks.value[index];
      const definedUpdates = Object.fromEntries(
        Object.entries(updatedTask).filter(([, v]) => v !== undefined)
      ) as Partial<Task> & { id: string };
      tasks.value[index] = { ...prev, ...definedUpdates } as Task;
    }
  }

  function deleteTask(id: string) {
    tasks.value = tasks.value.filter((t) => t.id !== id);
  }

  async function fetchTasks() {
    try {
      const data = await taskService.getTasks();
      tasks.value = data;
      return data;
    } catch (e) {
      console.error("[tasks] Failed to fetch tasks", e);
      return tasks.value;
    }
  }

  async function createTask(payload: Database["public"]["Tables"]["tasks"]["Insert"]) {
    const saved = await taskService.createTask(payload);
    // API-driven: update state only after API responds
    tasks.value = [saved, ...tasks.value.filter((t) => t.id !== saved.id)];
    return saved;
  }

  async function updateTaskRemote(
    id: string,
    updates: Database["public"]["Tables"]["tasks"]["Update"]
  ) {
    const saved = await taskService.updateTask(id, updates);
    updateTask(saved);
    return saved;
  }

  async function deleteTaskRemote(id: string) {
    await taskService.deleteTask(id);
    deleteTask(id);
  }

  async function toggleCompleteRemote(task: Task) {
    const newStatus =
      task.status === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED;
    return await updateTaskRemote(task.id, {
      status: newStatus,
      updated_at: new Date().toISOString(),
    });
  }

  return {
    tasks,
    selectedProjectId,
    filteredTasks,
    tasksByStatus,
    setSelectedProject,
    setTasks,
    updateTask,
    deleteTask,
    fetchTasks,
    createTask,
    updateTaskRemote,
    deleteTaskRemote,
    toggleCompleteRemote,
  };
});
