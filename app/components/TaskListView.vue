<script setup lang="ts">
import { computed, ref } from "vue";
import { useTaskStore } from "@/stores/tasks";
import { useProjectStore } from "@/stores/projects";
import { storeToRefs } from "pinia";
import { taskService } from "@/services/api";
import { useTaskFilters, type DateRangeFilter } from "@/composables/useTaskFilters";
import ProjectsSidebar from "@/components/task-list/ProjectsSidebar.vue";
import TaskListBlock from "@/components/task-list/TaskListBlock.vue";
import UpcomingSection from "@/components/task-list/UpcomingSection.vue";
import ScheduleCards from "@/components/task-list/ScheduleCards.vue";
import EditTaskDialog from "@/components/task-list/EditTaskDialog.vue";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Task } from "@/types";
import { TaskStatus } from "@/types";

const taskStore = useTaskStore();
const projectStore = useProjectStore();
const { tasks } = storeToRefs(taskStore);
const { projects } = storeToRefs(projectStore);

const selectedDateRange = ref<DateRangeFilter>("all");

const { todayList, upcomingList, upcomingDeadlines, filterCounts } = useTaskFilters({
  tasks,
  selectedProjectId: computed(() => taskStore.selectedProjectId),
  selectedDateRange,
});

const statusColors: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  in_review: "bg-amber-100 text-amber-700 border-amber-200",
  in_progress: "bg-sky-100 text-sky-700 border-sky-200",
  waiting: "bg-slate-100 text-slate-600 border-slate-200",
  cancelled: "bg-rose-100 text-rose-700 border-rose-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending: "bg-slate-100 text-slate-600 border-slate-200",
};

const scheduleItems = computed(() => {
  const palette = [
    "bg-amber-50 border-amber-100 text-amber-900",
    "bg-sky-50 border-sky-100 text-sky-900",
    "bg-rose-50 border-rose-100 text-rose-900",
    "bg-emerald-50 border-emerald-100 text-emerald-900",
  ] as const;

  if (!tasks.value.length) {
    return [
      {
        time: "08:05 AM - 09:20 AM",
        title: "Product sync",
        avatars: 5,
        color: "bg-amber-50 border-amber-100 text-amber-900",
      },
      {
        time: "10:05 AM - 12:20 PM",
        title: "Design review",
        avatars: 4,
        color: "bg-sky-50 border-sky-100 text-sky-900",
      },
      {
        time: "03:00 PM - 04:20 PM",
        title: "Planning",
        avatars: 6,
        color: "bg-rose-50 border-rose-100 text-rose-900",
      },
      {
        time: "04:30 PM - 05:30 PM",
        title: "Social product review",
        avatars: 7,
        color: "bg-emerald-50 border-emerald-100 text-emerald-900",
      },
    ];
  }
  return tasks.value.slice(0, 4).map((t, idx) => ({
    time: t.deadline
      ? new Date(t.deadline).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : `0${idx + 8}:00 AM - 0${idx + 9}:00 AM`,
    title: t.title,
    avatars: Math.max(3, (t.tags?.length || 2) + 2),
    color: palette[idx % palette.length]!,
  }));
});

const editingTask = ref<Task | null>(null);

const openEdit = (task: Task) => {
  editingTask.value = task;
};

const closeEdit = () => {
  editingTask.value = null;
};

const saveEdit = async (
  payload: Pick<Task, "title" | "description" | "status" | "project_id" | "deadline">
) => {
  if (!editingTask.value) return;
  try {
    const saved = await taskService.updateTask(editingTask.value.id, {
      ...payload,
      updated_at: new Date().toISOString(),
    });
    taskStore.updateTask(saved);
    closeEdit();
  } catch (e) {
    console.error("Failed to update task", e);
  }
};

const toggleComplete = async (task: Task) => {
  const newStatus =
    task.status === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED;
  try {
    const saved = await taskService.updateTask(task.id, {
      status: newStatus,
      updated_at: new Date().toISOString(),
    });
    taskStore.updateTask(saved);
  } catch (e) {
    console.error("Failed to toggle status", e);
  }
};
</script>

<template>
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-5">
    <ProjectsSidebar
      class="lg:col-span-1"
      :projects="projects"
      :selected-project-id="taskStore.selectedProjectId"
      :selected-date-range="selectedDateRange"
      :upcoming-deadlines="upcomingDeadlines"
      @select-project="taskStore.setSelectedProject"
      @select-date="(r) => (selectedDateRange = r)"
    />

    <div class="space-y-6 lg:col-span-3">
      <div class="flex items-center gap-4">
        <h2 class="text-3xl font-semibold tracking-tight">Today Task</h2>
        <div class="flex items-center gap-3 text-sm text-slate-500">
          <span class="flex items-center gap-1 text-base font-semibold text-slate-700">{{
            filterCounts.all
          }}</span
          ><span>All</span> <span class="flex items-center gap-1">{{ filterCounts.important }}</span
          ><span>Important</span>
          <span class="flex items-center gap-1">{{ filterCounts.notes }}</span
          ><span>Notes</span> <span class="flex items-center gap-1">{{ filterCounts.links }}</span
          ><span>Links</span>
        </div>
      </div>

      <Tabs default-value="today" class="w-full">
        <TabsList class="bg-slate-100/60">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        </TabsList>

        <TabsContent value="today" class="mt-4">
          <TaskListBlock
            :today-list="todayList"
            :upcoming-list="upcomingList"
            :status-colors="statusColors"
            @toggle="toggleComplete"
            @edit="openEdit"
          />
        </TabsContent>

        <TabsContent value="upcoming" class="mt-4">
          <TaskListBlock
            :today-list="upcomingList"
            :upcoming-list="[]"
            :status-colors="statusColors"
            @toggle="toggleComplete"
            @edit="openEdit"
          />
        </TabsContent>
      </Tabs>

      <div class="space-y-3">
        <h3 class="text-lg font-semibold">Upcoming Tasks</h3>
        <UpcomingSection
          :upcoming-list="upcomingList"
          :status-colors="statusColors"
          @toggle="toggleComplete"
          @edit="openEdit"
        />
      </div>
    </div>

    <div class="space-y-4 lg:col-span-1">
      <h3 class="text-xl font-semibold">Meetings Schedule</h3>
      <ScheduleCards :schedule-items="scheduleItems" />
    </div>
  </div>

  <EditTaskDialog
    :open="!!editingTask"
    :task="editingTask"
    :projects="projects"
    @close="closeEdit"
    @save="saveEdit"
  />
</template>
