<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useTaskStore } from "@/stores/tasks";
import { useProjectStore } from "@/stores/projects";
import { useCalendarEventsStore } from "@/stores/calendarEvents";
import { storeToRefs } from "pinia";
import { useTaskFilters, type DateRangeFilter, type SortOption } from "@/composables/useTaskFilters";
import { getUpcomingMeetings } from "@/helpers/calendar/display";
import { TASK_STATUSES, type TaskStatusFilter } from "@/constants/tasks";
import ProjectsSidebar from "@/components/task-list/ProjectsSidebar.vue";
import ProjectsCarousel from "@/components/task-list/ProjectsCarousel.vue";
import MobileFiltersDrawer from "@/components/task-list/MobileFiltersDrawer.vue";
import TaskListBlock from "@/components/task-list/TaskListBlock.vue";
import UpcomingEvents from "@/components/task-list/UpcomingEvents.vue";
import UpcomingEventsDrawer from "@/components/task-list/UpcomingEventsDrawer.vue";
import UpcomingSection from "@/components/task-list/UpcomingSection.vue";
import EditTaskDialog from "@/components/task-list/EditTaskDialog.vue";
import EditMeetingDialog from "@/components/calendar/EditMeetingDialog.vue";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Task, CalendarEvent } from "@/types";
import ScheduleXCalendarView from "@/components/calendar/ScheduleXCalendarView.client.vue";

const taskStore = useTaskStore();
const projectStore = useProjectStore();
const calendarEventsStore = useCalendarEventsStore();
const { filteredTasks } = storeToRefs(taskStore);
const { projects } = storeToRefs(projectStore);
const { events: calendarEvents } = storeToRefs(calendarEventsStore);

const projectColorById = computed<Record<string, string | null>>(() => {
  return Object.fromEntries(projects.value.map((p) => [p.id, p.color || null]));
});

const projectNameById = computed<Record<string, string>>(() => {
  return Object.fromEntries(projects.value.map((p) => [p.id, p.name]));
});

const viewMode = ref<"list" | "calendar">("list");

const selectedDateRange = ref<DateRangeFilter>("all");
const selectedStatus = ref<TaskStatusFilter>("all");
const sortBy = ref<SortOption>("created");

const { todayList, upcomingList, upcomingDeadlines, filterCounts } = useTaskFilters({
  tasks: filteredTasks,
  selectedProjectId: computed(() => taskStore.selectedProjectId),
  selectedDateRange,
  selectedStatus,
  sortBy,
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
  payload: Pick<
    Task,
    "title" | "description" | "status" | "project_id" | "start_at" | "end_at"
  >
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

const hasAnyTasks = computed(() => taskStore.filteredTasks.length > 0);

const upcomingMeetings = computed(() => getUpcomingMeetings(calendarEvents.value, 3));

const editingMeeting = ref<CalendarEvent | null>(null);

const openEditMeeting = (meeting: CalendarEvent) => {
  editingMeeting.value = meeting;
};

const closeEditMeeting = () => {
  editingMeeting.value = null;
};

// Fetch calendar events on mount for the next 30 days
onMounted(async () => {
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);
    await calendarEventsStore.fetchRange(today.toISOString(), futureDate.toISOString());
  } catch (e) {
    console.error("Failed to load calendar events", e);
  }
});
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-4">
    <!-- Mobile Projects Carousel -->
    <div class="lg:hidden">
      <ProjectsCarousel
        :projects="projects"
        :selected-project-id="taskStore.selectedProjectId"
        @select-project="taskStore.setSelectedProject"
      />
    </div>

    <!-- Main Content Grid -->
    <div class="grid h-full min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-5 lg:grid-rows-1">
      <!-- Desktop Projects Sidebar -->
      <div class="hidden h-full min-h-0 lg:col-span-1 lg:block">
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

      <!-- Tasks Content -->
      <div class="h-full min-h-0 lg:col-span-3">
        <ScrollArea class="h-full pr-1">
          <div class="space-y-4">
            <!-- Header with View Mode and Filters -->
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div class="flex items-center gap-3">
                <h2 class="text-2xl font-semibold tracking-tight sm:text-3xl">Today Task</h2>
                <Tabs v-model="viewMode" class="w-auto">
                  <TabsList class="bg-muted/40">
                    <TabsTrigger value="list" class="text-xs sm:text-sm">List</TabsTrigger>
                    <TabsTrigger value="calendar" class="text-xs sm:text-sm">Calendar</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div class="flex items-center gap-2 sm:ml-auto">
                <span
                  class="flex items-center gap-1 text-base font-semibold text-foreground"
                >
                  {{ filterCounts.all }}
                </span>

                <!-- Mobile: Upcoming Events Drawer -->
                <div class="lg:hidden">
                  <UpcomingEventsDrawer
                    v-if="hasAnyTasks"
                    :tasks="upcomingDeadlines"
                    :meetings="upcomingMeetings"
                    :project-name-by-id="projectNameById"
                    @edit-task="openEdit"
                    @edit-meeting="openEditMeeting"
                  />
                </div>

                <!-- Mobile: Unified Filters Drawer -->
                <div v-if="viewMode === 'list'" class="lg:hidden">
                  <MobileFiltersDrawer
                    :selected-status="selectedStatus"
                    :sort-by="sortBy"
                    @update-status="(v) => (selectedStatus = v)"
                    @update-sort="(v) => (sortBy = v)"
                  />
                </div>

                <!-- Desktop: Full Filter/Sort Controls -->
                <div v-if="viewMode === 'list'" class="hidden items-center gap-4 lg:flex">
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-muted-foreground">Status:</span>
                    <Select v-model="selectedStatus">
                      <SelectTrigger class="w-[140px] cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          v-for="status in TASK_STATUSES"
                          :key="status.value"
                          :value="status.value"
                          class="cursor-pointer"
                        >
                          {{ status.label }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-muted-foreground">Sort by:</span>
                    <Select v-model="sortBy">
                      <SelectTrigger class="w-[140px] cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created" class="cursor-pointer"
                          >Created Date</SelectItem
                        >
                        <SelectItem value="date" class="cursor-pointer">Due Date</SelectItem>
                        <SelectItem value="status" class="cursor-pointer">Status</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <!-- List View -->
            <template v-if="viewMode === 'list'">
              <!-- Empty State (shown at top when no tasks) -->
              <div
                v-if="!hasAnyTasks"
                class="rounded-lg border border-dashed p-8 text-center sm:p-10"
              >
                <div class="text-base font-semibold sm:text-lg">No tasks yet</div>
                <div class="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Create your first task to see it here (and on the calendar).
                </div>
              </div>

              <!-- Tasks Tabs -->
              <Tabs v-if="hasAnyTasks" default-value="today" class="w-full">
                <TabsList class="bg-muted/40 w-full sm:w-auto">
                  <TabsTrigger value="today" class="flex-1 sm:flex-none">Today</TabsTrigger>
                  <TabsTrigger value="upcoming" class="flex-1 sm:flex-none"
                    >Upcoming</TabsTrigger
                  >
                </TabsList>

                <TabsContent value="today" class="mt-4">
                  <TaskListBlock
                    :today-list="todayList"
                    :upcoming-list="upcomingList"
                    :status-colors="statusColors"
                    :project-name-by-id="projectNameById"
                    @toggle="toggleComplete"
                    @edit="openEdit"
                  />
                </TabsContent>

                <TabsContent value="upcoming" class="mt-4">
                  <TaskListBlock
                    :today-list="upcomingList"
                    :upcoming-list="[]"
                    :status-colors="statusColors"
                    :project-name-by-id="projectNameById"
                    @toggle="toggleComplete"
                    @edit="openEdit"
                  />
                </TabsContent>
              </Tabs>

              <div v-if="hasAnyTasks" class="space-y-3">
                <h3 class="text-base font-semibold sm:text-lg">Upcoming Tasks</h3>
                <UpcomingSection
                  :upcoming-list="upcomingList"
                  :status-colors="statusColors"
                  :project-name-by-id="projectNameById"
                  @toggle="toggleComplete"
                  @edit="openEdit"
                />
              </div>
            </template>

            <!-- Calendar View -->
            <template v-else>
              <client-only>
                <ScheduleXCalendarView
                  mode="tasks"
                  :meetings="[]"
                  :tasks="taskStore.filteredTasks"
                  :project-color-by-id="projectColorById"
                  :project-name-by-id="projectNameById"
                  @range-change="() => {}"
                  @event-click="
                    ({ kind, id }) => {
                      if (kind !== 'task') return;
                      const t = taskStore.tasks.find((x) => x.id === id);
                      if (t) openEdit(t);
                    }
                  "
                />
              </client-only>
            </template>
          </div>
        </ScrollArea>
      </div>

      <!-- Desktop Upcoming Events Sidebar -->
      <div class="hidden h-full min-h-0 lg:col-span-1 lg:block">
        <ScrollArea class="h-full pr-1">
          <div
            v-if="!hasAnyTasks"
            class="rounded-lg border border-dashed p-6 text-sm text-muted-foreground"
          >
            No upcoming events yet.
          </div>
          <UpcomingEvents
            v-else
            :tasks="upcomingDeadlines"
            :meetings="upcomingMeetings"
            :project-name-by-id="projectNameById"
            @edit-task="openEdit"
            @edit-meeting="openEditMeeting"
          />
        </ScrollArea>
      </div>
    </div>
  </div>

  <EditTaskDialog
    :open="!!editingTask"
    :task="editingTask"
    :projects="projects"
    @close="closeEdit"
    @save="saveEdit"
    @delete="
      async (id) => {
        await taskStore.deleteTaskRemote(id);
        closeEdit();
      }
    "
  />

  <EditMeetingDialog
    :open="!!editingMeeting"
    :meeting="editingMeeting"
    :projects="projects"
    @close="closeEditMeeting"
  />
</template>
