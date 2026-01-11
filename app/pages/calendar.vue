<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCalendarEventsStore } from "@/stores/calendarEvents";
import { useTaskStore } from "@/stores/tasks";
import { useProjectStore } from "@/stores/projects";
import ScheduleXCalendarView from "@/components/calendar/ScheduleXCalendarView.client.vue";
import ImportMeetingsDialog from "@/components/calendar/ImportMeetingsDialog.vue";
import MeetingCreateForm from "@/components/calendar/MeetingCreateForm.vue";
import EditTaskDialog from "@/components/task-list/EditTaskDialog.vue";
import EditMeetingDialog from "@/components/calendar/EditMeetingDialog.vue";
import type { CalendarEvent, Task } from "@/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import TaskCreateForm from "@/components/task-create/TaskCreateForm.vue";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { toast } from "vue-sonner";

const calendarStore = useCalendarEventsStore();
const taskStore = useTaskStore();
const projectStore = useProjectStore();
const user = useSupabaseUser();
const isOwner = computed(() => Boolean(user.value));

const { events } = storeToRefs(calendarStore);
const { filteredTasks } = storeToRefs(taskStore);
const { projects } = storeToRefs(projectStore);

const projectColorById = computed<Record<string, string | null>>(() => {
  return Object.fromEntries(projects.value.map((p) => [p.id, p.color || null]));
});
const projectNameById = computed<Record<string, string | null>>(() => {
  return Object.fromEntries(projects.value.map((p) => [p.id, p.name]));
});

const mode = ref<"meetings" | "tasks">("meetings");
const isImportOpen = ref(false);
const isCreateMeetingOpen = ref(false);
const isCreateTaskOpen = ref(false);
const isCalendarReady = ref(false);
const meetingSeed = ref(0);
const taskSeed = ref(0);
const slotStart = ref<Date | null>(null);
const slotEnd = ref<Date | null>(null);
const editingTask = ref<Task | null>(null);
const editingMeeting = ref<CalendarEvent | null>(null);

const onCalendarEventClick = ({ kind, id }: { kind: "task" | "meeting"; id: string }) => {
  if (!isOwner.value) {
    toast.message("Read-only calendar", {
      description: "Sign in to edit meetings and tasks.",
    });
    return;
  }
  if (kind === "task") {
    const t = taskStore.tasks.find((x) => x.id === id) || null;
    editingTask.value = t;
    editingMeeting.value = null;
    return;
  }

  const m = events.value.find((x) => x.id === id) || null;
  editingMeeting.value = m;
  editingTask.value = null;
};

const onCalendarSlotClick = (payload: { date: Date; isAllDay: boolean }) => {
  if (!isOwner.value) {
    toast.message("Read-only calendar", {
      description: "Sign in to create meetings or tasks.",
    });
    return;
  }
  const start = payload.isAllDay
    ? new Date(
        payload.date.getFullYear(),
        payload.date.getMonth(),
        payload.date.getDate(),
        9,
        0,
        0,
        0
      )
    : payload.date;
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  slotStart.value = start;
  slotEnd.value = end;

  if (mode.value === "meetings") {
    meetingSeed.value += 1;
    isCreateMeetingOpen.value = true;
  } else {
    taskSeed.value += 1;
    isCreateTaskOpen.value = true;
  }
};

const onTaskSave = async (
  payload: Pick<Task, "title" | "description" | "status" | "project_id" | "start_at" | "end_at">
) => {
  if (!editingTask.value) return;
  await taskStore.updateTaskRemote(editingTask.value.id, {
    ...payload,
    updated_at: new Date().toISOString(),
  });
  editingTask.value = null;
};

const onTaskDelete = async (id: string) => {
  await taskStore.deleteTaskRemote(id);
  editingTask.value = null;
};

onMounted(async () => {
  // preload everything BEFORE mounting calendar (avoids view/recurrence timing issues)
  isCalendarReady.value = false;
  if (isOwner.value) {
    await Promise.all([
      taskStore.tasks.length ? Promise.resolve() : taskStore.fetchTasks(),
      projectStore.projects.length ? Promise.resolve() : projectStore.fetchProjects(),
    ]);
  }

  const now = new Date();
  const monthStart = startOfWeek(startOfMonth(now), { weekStartsOn: 1 });
  const monthEnd = endOfWeek(endOfMonth(now), { weekStartsOn: 1 });
  await calendarStore.fetchRange(monthStart.toISOString(), monthEnd.toISOString());
  isCalendarReady.value = true;
});

const title = computed(() =>
  isOwner.value
    ? mode.value === "meetings"
      ? "Calendar · Meetings"
      : "Calendar · Tasks"
    : "Calendar · Public"
);

useHead(() => ({ title: title.value }));
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-semibold tracking-tight">Calendar</h1>
        <Tabs v-if="isOwner" v-model="mode" class="w-auto">
          <TabsList class="bg-slate-100/60">
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>
        </Tabs>
        <p v-else class="text-sm text-slate-500">Read-only agenda</p>
      </div>

      <div class="flex items-center gap-2">
        <Button v-if="isOwner" variant="outline" @click="isImportOpen = true">Import</Button>
        <Button v-if="isOwner && mode === 'meetings'" @click="isCreateMeetingOpen = true"
          >New meeting</Button
        >
        <Button v-if="!isOwner" as-child variant="outline" class="cursor-pointer">
          <NuxtLink to="/login">Sign in</NuxtLink>
        </Button>
      </div>
    </div>

    <div
      v-if="!isCalendarReady"
      class="rounded-lg border border-dashed border-slate-200 bg-white/60 p-10 text-center text-sm text-slate-500"
    >
      Loading calendar…
    </div>

    <client-only v-else>
      <ScheduleXCalendarView
        :mode="isOwner ? mode : 'meetings'"
        :meetings="events"
        :tasks="isOwner ? filteredTasks : []"
        :project-color-by-id="isOwner ? projectColorById : {}"
        :project-name-by-id="isOwner ? projectNameById : {}"
        @range-change="({ startIso, endIso }) => calendarStore.fetchRange(startIso, endIso)"
        @event-click="onCalendarEventClick"
        @slot-click="onCalendarSlotClick"
      />
    </client-only>

    <ImportMeetingsDialog v-if="isOwner" :open="isImportOpen" @close="isImportOpen = false" />

    <Sheet v-if="isOwner" v-model:open="isCreateMeetingOpen">
      <SheetContent side="right" class="w-full overflow-y-auto sm:max-w-[560px]">
        <SheetHeader class="mb-4">
          <SheetTitle>Create meeting</SheetTitle>
        </SheetHeader>
        <MeetingCreateForm
          :key="meetingSeed"
          :projects="projects"
          :initial-start="slotStart"
          :initial-end="slotEnd"
          @created="isCreateMeetingOpen = false"
          @cancel="isCreateMeetingOpen = false"
        />
      </SheetContent>
    </Sheet>

    <Sheet v-if="isOwner" v-model:open="isCreateTaskOpen">
      <SheetContent side="right" class="w-full overflow-y-auto sm:max-w-[560px]">
        <SheetHeader class="mb-4">
          <SheetTitle>Create task</SheetTitle>
        </SheetHeader>
        <TaskCreateForm
          :key="taskSeed"
          :initial-start="slotStart"
          :initial-end="slotEnd"
          @created="isCreateTaskOpen = false"
          @cancel="isCreateTaskOpen = false"
        />
      </SheetContent>
    </Sheet>

    <EditTaskDialog
      v-if="isOwner"
      :open="!!editingTask"
      :task="editingTask"
      :projects="projects"
      @close="editingTask = null"
      @save="onTaskSave"
      @delete="onTaskDelete"
    />

    <EditMeetingDialog
      v-if="isOwner"
      :open="!!editingMeeting"
      :meeting="editingMeeting"
      :projects="projects"
      @close="editingMeeting = null"
    />
  </div>
</template>
