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

  const filteredTasks = computed(() => {
    return tasks.value.filter((t) => {
      if (selectedProjectId.value) {
        if (t.project_id !== selectedProjectId.value) return false;
      }

      if (selectedDateRange.value) {
        if (selectedDateRange.value === "all") return true;
        if (!t.deadline) return false;
        const d = new Date(t.deadline);
        if (!isValid(d)) return false;
        const diffDays = differenceInCalendarDays(startOfDay(d), todayStart.value);
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
      .sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""))
  );

  const upcomingDeadlines = computed(() =>
    tasks.value
      .filter((t) => t.deadline && isValid(new Date(t.deadline)))
      .filter((t) => {
        const d = new Date(t.deadline as string);
        const daysLeft = differenceInCalendarDays(startOfDay(d), todayStart.value);
        // Upcoming events in next 1-3 days
        return daysLeft >= 1 && daysLeft <= 3;
      })
      .sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""))
      .slice(0, 3)
  );

  const filterCounts = computed(() => ({
    all: tasks.value.length,
    important: tasks.value.filter((t) => t.priority === "high" || t.priority === "urgent").length,
    notes: tasks.value.filter((t) => t.tags?.length).length,
    links: tasks.value.filter((t) => t.attachments?.length).length,
  }));

  return {
    filteredTasks,
    todayList,
    upcomingList,
    upcomingDeadlines,
    filterCounts,
  };
}
