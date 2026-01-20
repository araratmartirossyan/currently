<script setup lang="ts">
import { ref } from "vue";
import { CalendarDays } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import UpcomingEvents from "@/components/task-list/UpcomingEvents.vue";
import type { Task, CalendarEvent } from "@/types";

interface Props {
  tasks: Task[];
  meetings: CalendarEvent[];
  projectNameById: Record<string, string>;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "editTask", task: Task): void;
  (e: "editMeeting", meeting: CalendarEvent): void;
}>();

const open = ref(false);
</script>

<template>
  <Sheet v-model:open="open">
    <SheetTrigger as-child>
      <Button variant="outline" size="sm" class="cursor-pointer">
        <CalendarDays class="mr-2 h-4 w-4" />
        Upcoming Events
        <Badge v-if="tasks.length + meetings.length > 0" variant="secondary" class="ml-2">
          {{ tasks.length + meetings.length }}
        </Badge>
      </Button>
    </SheetTrigger>
    <SheetContent side="bottom" class="h-[85vh]">
      <SheetHeader class="mb-4">
        <SheetTitle>Upcoming Events</SheetTitle>
      </SheetHeader>
      <div class="overflow-y-auto" style="height: calc(85vh - 80px)">
        <UpcomingEvents
          :tasks="tasks"
          :meetings="meetings"
          :project-name-by-id="projectNameById"
          @edit-task="
            (task) => {
              emit('editTask', task);
              open = false;
            }
          "
          @edit-meeting="
            (meeting) => {
              emit('editMeeting', meeting);
              open = false;
            }
          "
        />
      </div>
    </SheetContent>
  </Sheet>
</template>
