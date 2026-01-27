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
  user_id?: string | null;
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
  start_at?: string | null;
  end_at?: string | null;
}

export interface Project {
  id: string;
  user_id?: string | null;
  name: string;
  description?: string | null;
  color?: string | null;
  category?: string | null;
  subcategory?: string | null;
  created_at: string;
}

export type CalendarEventSource = "import" | "manual" | "google" | "outlook";

export interface CalendarEvent {
  id: string;
  user_id?: string | null;
  project_id?: string | null;
  title: string;
  description?: string | null;
  location?: string | null;
  start_at: string;
  end_at: string;
  is_all_day: boolean;
  rrule?: string | null;
  exdates?: string[] | null;
  source: CalendarEventSource | string;
  source_uid?: string | null;
  source_calendar?: string | null;
  raw_payload?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListItem {
  id: string;
  text: string;
  checked: boolean;
  created_at: string;
  checked_at: string | null;
}
