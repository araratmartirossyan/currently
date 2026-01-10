import { defineStore } from "pinia";
import type { Project } from "@/types";
import { projectService } from "@/services/api";
import type { Database } from "~/types/database.types";

export const useProjectStore = defineStore("projects", () => {
  const projects = ref<Project[]>([]);

  async function fetchProjects() {
    const data = await projectService.getProjects();
    projects.value = data;
    return data;
  }

  function setProjects(newProjects: Project[]) {
    projects.value = newProjects;
  }

  function updateProject(updated: Partial<Project> & { id: string }) {
    const idx = projects.value.findIndex((p) => p.id === updated.id);
    if (idx !== -1) {
      projects.value[idx] = { ...projects.value[idx], ...updated } as Project;
    }
  }

  function deleteProject(id: string) {
    projects.value = projects.value.filter((p) => p.id !== id);
  }

  async function createProject(payload: Database["public"]["Tables"]["projects"]["Insert"]) {
    const saved = await projectService.createProject(payload);
    projects.value = [...projects.value.filter((p) => p.id !== saved.id), saved].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    return saved;
  }

  async function updateProjectRemote(
    id: string,
    updates: Database["public"]["Tables"]["projects"]["Update"]
  ) {
    const saved = await projectService.updateProject(id, updates);
    updateProject(saved);
    projects.value = projects.value.slice().sort((a, b) => a.name.localeCompare(b.name));
    return saved;
  }

  async function deleteProjectRemote(id: string) {
    await projectService.deleteProject(id);
    deleteProject(id);

    // Keep tasks consistent after the project is removed (tasks.project_id set to null)
    const { useTaskStore } = await import("@/stores/tasks");
    const taskStore = useTaskStore();
    await taskStore.fetchTasks();
  }

  return {
    projects,
    fetchProjects,
    setProjects,
    updateProject,
    deleteProject,
    createProject,
    updateProjectRemote,
    deleteProjectRemote,
  };
});
