import { useTaskStore } from "@/stores/tasks";
import { useProjectStore } from "@/stores/projects";
import { TaskPriority, TaskStatus, type Project, type Task } from "@/types";

export default defineNuxtPlugin(() => {
  const taskStore = useTaskStore();
  const projectStore = useProjectStore();

  /**
   * Seed mock data only when Supabase credentials are missing.
   * If SUPABASE_URL / SUPABASE_KEY are set, do nothing.
   */
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_KEY || "";

  if (!supabaseUrl || !supabaseKey) {
    const initialTasks: Task[] = [
      {
        id: "1",
        title: "Initialize project",
        description: "Set up Nuxt and Pinia",
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.HIGH,
        tags: ["Setup"],
        attachments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        project_id: null,
        category: null,
        subcategory: null,
        deadline: null,
      },
      {
        id: "2",
        title: "Implement Kanban",
        description: "Add vuedraggable and board layout",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        tags: ["Frontend"],
        attachments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        project_id: null,
        category: null,
        subcategory: null,
        deadline: null,
      },
      {
        id: "3",
        title: "Voice Task",
        description: "Test voice recording extraction",
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        tags: ["AI"],
        attachments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        project_id: null,
        category: null,
        subcategory: null,
        deadline: null,
      },
    ];

    const initialProjects: Project[] = [
      { id: "1", name: "DAT Project", created_at: new Date().toISOString() },
      { id: "2", name: "Personal", created_at: new Date().toISOString() },
    ];

    taskStore.setTasks(initialTasks);
    projectStore.setProjects(initialProjects);
  }
});
