import { useSupabaseClient } from "#imports";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Task, Project } from "@/types";
import type { Database } from "~/types/database.types";

export const taskService = {
  async getTasks() {
    const supabase = useSupabaseClient() as SupabaseClient<Database>;
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Task[];
  },

  async createTask(task: Database["public"]["Tables"]["tasks"]["Insert"]) {
    const supabase = useSupabaseClient() as SupabaseClient<Database>;
    const { data, error } = await supabase.from("tasks").insert(task).select().single();

    if (error) throw error;
    return data as Task;
  },

  async updateTask(id: string, updates: Database["public"]["Tables"]["tasks"]["Update"]) {
    const supabase = useSupabaseClient() as SupabaseClient<Database>;
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
    const supabase = useSupabaseClient() as SupabaseClient<Database>;
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) throw error;
  },
};

export const projectService = {
  async getProjects() {
    const supabase = useSupabaseClient() as SupabaseClient<Database>;
    const { data, error } = await supabase.from("projects").select("*").order("name");

    if (error) throw error;
    return data as Project[];
  },

  async createProject(project: Database["public"]["Tables"]["projects"]["Insert"]) {
    const supabase = useSupabaseClient() as SupabaseClient<Database>;
    const { data, error } = await supabase.from("projects").insert(project).select().single();

    if (error) throw error;
    return data as Project;
  },

  async updateProject(id: string, updates: Database["public"]["Tables"]["projects"]["Update"]) {
    const supabase = useSupabaseClient() as SupabaseClient<Database>;
    const { data, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Project;
  },

  /**
   * Delete project. To avoid FK errors when tasks reference this project,
   * we first null out tasks.project_id (unless your DB has ON DELETE SET NULL).
   */
  async deleteProject(id: string) {
    const supabase = useSupabaseClient() as SupabaseClient<Database>;

    // Best-effort: don't fail deletion if update fails due to missing perms/RLS.
    await supabase.from("tasks").update({ project_id: null }).eq("project_id", id);

    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
  },
};
