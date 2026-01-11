import type { Task } from "@/types";

export function getTaskLastDate(task: Task): Date | null {
  const iso = task.end_at || task.deadline || task.start_at || null;
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatTaskLastDay(task: Task): string {
  const d = getTaskLastDate(task);
  if (!d) return "";
  // MMM dd, in user locale
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "2-digit" }).format(d);
}

export function formatTaskTitleWithMeta(args: {
  task: Task;
  projectName?: string;
}): string {
  const title = args.task.title || "Untitled task";
  const project = args.projectName?.trim();
  const lastDay = formatTaskLastDay(args.task);
  const parts = [project, title, lastDay ? `by ${lastDay}` : null].filter(Boolean);
  return parts.join(" · ");
}

