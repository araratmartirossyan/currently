export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  project_id?: string | null;
  category?: string | null;
  subcategory?: string | null;
  tags: string[];
  attachments: string[];
  created_at: string;
  updated_at: string;
  deadline?: string | null;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  category?: string | null;
  subcategory?: string | null;
  created_at: string;
}
