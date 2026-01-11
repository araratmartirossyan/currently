import { computed, type Ref } from "vue";
import { differenceInCalendarDays, isValid, startOfDay } from "date-fns";
import type { Task } from "@/types";

export type DateRangeFilter = "all" | "today" | "tomorrow" | "7" | "30";

interface Options {
  tasks: Ref<Task[]>;
  selectedProjectId: Ref<string | null>;
  selectedDateRange: Ref<DateRangeFilter>;
}

export function useTaskFilters({ tasks, selectedProjectId, selectedDateRange }: Options) {
  const todayStart = computed(() => startOfDay(new Date()));

  function taskLastDate(task: Task): Date | null {
    const iso = task.end_at || task.start_at || task.deadline || null;
    if (!iso) return null;
    const d = new Date(iso);
    return isValid(d) ? d : null;
  }

  const filteredTasks = computed(() => {
    return tasks.value.filter((t) => {
      if (t.status === "completed") return false;
      if (selectedProjectId.value) {
        if (t.project_id !== selectedProjectId.value) return false;
      }

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

  const todayList = computed(() =>
    filteredTasks.value
      .slice()
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
  );

  const upcomingList = computed(() =>
    filteredTasks.value
      .filter((t) => t.status !== "completed")
      .slice()
      .sort((a, b) => (taskLastDate(a)?.toISOString() || "").localeCompare(taskLastDate(b)?.toISOString() || ""))
  );

  const upcomingDeadlines = computed(() =>
    tasks.value
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
