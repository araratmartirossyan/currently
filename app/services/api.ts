import { useSupabaseClient } from "#imports";
import type { Task, Project } from "@/types";

export const taskService = {
  async getTasks() {
    const supabase = useSupabaseClient();
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Task[];
  },

  async createTask(task: Partial<Task>) {
    const supabase = useSupabaseClient();
    const { data, error } = await supabase.from("tasks").insert(task).select().single();

    if (error) throw error;
    return data as Task;
  },

  async updateTask(id: string, updates: Partial<Task>) {
    const supabase = useSupabaseClient();
    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  },

  async deleteTask(id: string) {
    const supabase = useSupabaseClient();
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) throw error;
  },
};

export const projectService = {
  async getProjects() {
    const supabase = useSupabaseClient();
    const { data, error } = await supabase.from("projects").select("*").order("name");

    if (error) throw error;
    return data as Project[];
  },

  async createProject(project: Partial<Project>) {
    const supabase = useSupabaseClient();
    const { data, error } = await supabase.from("projects").insert(project).select().single();

    if (error) throw error;
    return data as Project;
  },
};
