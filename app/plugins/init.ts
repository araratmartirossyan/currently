import { useTaskStore } from "@/stores/tasks";
import { useProjectStore } from "@/stores/projects";
import type { Project, Task } from "@/types";

export default defineNuxtPlugin(() => {
  const taskStore = useTaskStore();
  const projectStore = useProjectStore();

  /**
   * Seed mock data only when Supabase credentials are missing.
   * If SUPABASE_URL / SUPABASE_KEY are set, do nothing.
   */
  const config = useRuntimeConfig();
  const supabaseUrl =
    config.public?.supabaseUrl ||
    process.env.SUPABASE_URL ||
    process.env.NUXT_PUBLIC_SUPABASE_URL ||
    "";
  const supabaseKey =
    config.public?.supabaseKey ||
    process.env.SUPABASE_KEY ||
    process.env.NUXT_PUBLIC_SUPABASE_KEY ||
    process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  if (!supabaseUrl || !supabaseKey) {
    const initialTasks: Task[] = [];

    const initialProjects: Project[] = [];

    taskStore.setTasks(initialTasks);
    projectStore.setProjects(initialProjects);
  }
});
