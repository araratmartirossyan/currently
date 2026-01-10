import { defineStore } from "pinia";
import type { Project } from "@/types";

export const useProjectStore = defineStore("projects", () => {
  const projects = ref<Project[]>([]);

  function setProjects(newProjects: Project[]) {
    projects.value = newProjects;
  }

  function addProject(project: Project) {
    projects.value.push(project);
  }

  return {
    projects,
    setProjects,
    addProject,
  };
});
