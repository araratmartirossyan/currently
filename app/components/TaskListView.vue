<script setup lang="ts">
import { computed, ref } from "vue";
import { useTaskStore } from "@/stores/tasks";
import { useProjectStore } from "@/stores/projects";
import { storeToRefs } from "pinia";
import { useTaskFilters, type DateRangeFilter } from "@/composables/useTaskFilters";
import ProjectsSidebar from "@/components/task-list/ProjectsSidebar.vue";
import TaskListBlock from "@/components/task-list/TaskListBlock.vue";
import UpcomingEvents from "@/components/task-list/UpcomingEvents.vue";
import UpcomingSection from "@/components/task-list/UpcomingSection.vue";
import EditTaskDialog from "@/components/task-list/EditTaskDialog.vue";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Task } from "@/types";

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
    await taskStore.updateTaskRemote(editingTask.value.id, {
      ...payload,
      updated_at: new Date().toISOString(),
    });
    closeEdit();
  } catch (e) {
    console.error("Failed to update task", e);
  }
};

const toggleComplete = async (task: Task) => {
  try {
    await taskStore.toggleCompleteRemote(task);
  } catch (e) {
    console.error("Failed to toggle status", e);
  }
};
</script>

<template>
  <div class="grid h-full min-h-0 grid-cols-1 gap-6 lg:grid-cols-5 lg:grid-rows-1">
    <div class="h-full min-h-0 lg:col-span-1">
      <ScrollArea class="h-full pr-1">
        <ProjectsSidebar
          :projects="projects"
          :selected-project-id="taskStore.selectedProjectId"
          :selected-date-range="selectedDateRange"
          :upcoming-deadlines="upcomingDeadlines"
          @select-project="taskStore.setSelectedProject"
          @select-date="(r) => (selectedDateRange = r)"
        />
      </ScrollArea>
    </div>

    <div class="h-full min-h-0 lg:col-span-3">
      <ScrollArea class="h-full pr-1">
        <div class="space-y-6">
          <div class="flex items-center gap-4">
            <h2 class="text-3xl font-semibold tracking-tight">Today Task</h2>
            <div class="flex items-center gap-3 text-sm text-slate-500">
              <span class="flex items-center gap-1 text-base font-semibold text-slate-700">{{
                filterCounts.all
              }}</span
              ><span>All</span>
              <span class="flex items-center gap-1">{{ filterCounts.important }}</span
              ><span>Important</span>
              <span class="flex items-center gap-1">{{ filterCounts.notes }}</span
              ><span>Notes</span>
              <span class="flex items-center gap-1">{{ filterCounts.links }}</span
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
      </ScrollArea>
    </div>

    <div class="h-full min-h-0 lg:col-span-1">
      <ScrollArea class="h-full pr-1">
        <UpcomingEvents :tasks="upcomingDeadlines" @edit="openEdit" />
      </ScrollArea>
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
