import { computed, type Ref } from "vue";
import { differenceInCalendarDays, isValid, startOfDay } from "date-fns";
import type { Task } from "@/types";
import { compareTasksByStatus } from "@/helpers/tasks/sorting";
import type { TaskStatusFilter } from "@/constants/tasks";

export type DateRangeFilter = "all" | "today" | "tomorrow" | "7" | "30";
export type SortOption = "date" | "status" | "created";

interface Options {
  tasks: Ref<Task[]>;
  selectedProjectId: Ref<string | null>;
  selectedDateRange: Ref<DateRangeFilter>;
  selectedStatus?: Ref<TaskStatusFilter>;
  sortBy?: Ref<SortOption>;
}

export function useTaskFilters({ tasks, selectedProjectId, selectedDateRange, selectedStatus, sortBy }: Options) {
  const todayStart = computed(() => startOfDay(new Date()));

  function taskLastDate(task: Task): Date | null {
    const iso = task.end_at || task.start_at || task.deadline || null;
    if (!iso) return null;
    const d = new Date(iso);
    return isValid(d) ? d : null;
  }

  const filteredTasks = computed(() => {
    return tasks.value.filter((t) => {
      // Filter by status
      const statusFilter = selectedStatus?.value ?? "all";
      if (statusFilter !== "all" && t.status !== statusFilter) {
        return false;
      }

      // Always exclude completed tasks unless explicitly filtering for them
      if (statusFilter !== "completed" && t.status === "completed") {
        return false;
      }

      // Filter by project
      if (selectedProjectId.value) {
        if (t.project_id !== selectedProjectId.value) return false;
      }

      // Filter by date range
      if (selectedDateRange.value) {
        if (selectedDateRange.value === "all") return true;
        const last = taskLastDate(t);
        if (!last) return false;
        const diffDays = differenceInCalendarDays(startOfDay(last), todayStart.value);
        if (selectedDateRange.value === "today" && diffDays !== 0) return false;
        if (selectedDateRange.value === "tomorrow" && diffDays !== 1) return false;
        if (selectedDateRange.value === "7" && !(diffDays >= 0 && diffDays <= 7)) return false;
        if (selectedDateRange.value === "30" && !(diffDays >= 0 && diffDays <= 30)) return false;
      }

      return true;
    });
  });

  function sortTasks(taskList: Task[]): Task[] {
    const sorted = taskList.slice();
    const currentSortBy = sortBy?.value ?? "created";

    if (currentSortBy === "status") {
      return sorted.sort((a, b) => compareTasksByStatus(a.status, b.status));
    } else if (currentSortBy === "date") {
      return sorted.sort((a, b) =>
        (taskLastDate(a)?.toISOString() || "").localeCompare(taskLastDate(b)?.toISOString() || "")
      );
    } else {
      // Default: sort by created date (newest first)
      return sorted.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    }
  }

  const todayList = computed(() => {
    const todayTasks = filteredTasks.value.filter((t) => {
      const last = taskLastDate(t);
      if (!last) return true; // Include tasks without dates in "Today"
      const diffDays = differenceInCalendarDays(startOfDay(last), todayStart.value);
      return diffDays === 0; // Only tasks due today
    });
    return sortTasks(todayTasks);
  });

  const upcomingList = computed(() => {
    const upcomingTasks = filteredTasks.value.filter((t) => {
      if (t.status === "completed") return false;
      const last = taskLastDate(t);
      if (!last) return false; // Exclude tasks without dates from "Upcoming"
      const diffDays = differenceInCalendarDays(startOfDay(last), todayStart.value);
      return diffDays > 0; // Only future tasks
    });
    return sortTasks(upcomingTasks);
  });

  const upcomingDeadlines = computed(() =>
    filteredTasks.value
      .filter((t) => t.status !== "completed")
      .filter((t) => Boolean(taskLastDate(t)))
      .filter((t) => {
        const d = taskLastDate(t) as Date;
        const daysLeft = differenceInCalendarDays(startOfDay(d), todayStart.value);
        // Upcoming events in next 1-3 days
        return daysLeft >= 1 && daysLeft <= 3;
      })
      .sort((a, b) => (taskLastDate(a)?.toISOString() || "").localeCompare(taskLastDate(b)?.toISOString() || ""))
      .slice(0, 3)
  );

  const filterCounts = computed(() => ({
    all: filteredTasks.value.length,
    important: filteredTasks.value.filter((t) => t.priority === "high" || t.priority === "urgent").length,
    notes: filteredTasks.value.filter((t) => t.tags?.length).length,
    links: filteredTasks.value.filter((t) => t.attachments?.length).length,
  }));

  return {
    filteredTasks,
    todayList,
    upcomingList,
    upcomingDeadlines,
    filterCounts,
  };
}
