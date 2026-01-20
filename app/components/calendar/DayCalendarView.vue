<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import { format, addDays, subDays, isToday } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Task, CalendarEvent } from "@/types";
import { useDayCalendar } from "@/composables/useDayCalendar";

interface Props {
  tasks: Task[];
  meetings: CalendarEvent[];
  projectNameById: Record<string, string>;
  statusColors: Record<string, string>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "editTask", task: Task): void;
  (e: "editMeeting", meeting: CalendarEvent): void;
}>();

const selectedDate = ref(new Date());

const goToPreviousDay = () => {
  selectedDate.value = subDays(selectedDate.value, 1);
};

const goToNextDay = () => {
  selectedDate.value = addDays(selectedDate.value, 1);
};

const goToToday = () => {
  selectedDate.value = new Date();
};

const isSelectedToday = computed(() => isToday(selectedDate.value));

// Use composable for event processing logic
const { dayEvents } = useDayCalendar({
  selectedDate,
  meetings: toRef(props, "meetings"),
  projectNameById: toRef(props, "projectNameById"),
});
</script>

<template>
  <Card class="h-full flex flex-col shadow-sm">
    <CardHeader class="flex-none border-b pb-3">
      <div class="space-y-3">
        <!-- Navigation Controls -->
        <div class="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 cursor-pointer"
            @click="goToPreviousDay"
          >
            <ChevronLeft class="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            :class="[
              'cursor-pointer',
              isSelectedToday ? 'bg-primary text-primary-foreground' : '',
            ]"
            @click="goToToday"
          >
            Today
          </Button>

          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 cursor-pointer"
            @click="goToNextDay"
          >
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>

        <!-- Selected Date -->
        <div class="text-center">
          <div class="text-2xl font-semibold">
            {{ format(selectedDate, "EEE, MMM d") }}
          </div>
          <div class="text-sm text-muted-foreground">
            {{ format(selectedDate, "yyyy") }}
          </div>
        </div>
      </div>
    </CardHeader>

    <CardContent class="flex-1 p-0">
      <ScrollArea class="h-full">
        <div v-if="dayEvents.length === 0" class="p-8 text-center">
          <div class="text-sm text-muted-foreground">
            No events scheduled for this day
          </div>
        </div>

        <div v-else class="divide-y">
          <button
            v-for="(event, index) in dayEvents"
            :key="`${event.type}-${index}`"
            class="flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left hover:bg-muted/40"
            @click="emit('editMeeting', event.meeting)"
          >
            <!-- Time -->
            <div class="w-20 shrink-0 pt-1 text-xs font-medium text-muted-foreground">
              {{ event.time }} - {{ event.endTime }}
            </div>
       

            <!-- Event Details -->
            <div class="flex-1 space-y-1">
              <div class="font-medium leading-tight">
                {{ event.title }}
              </div>
              <div v-if="event.project" class="text-xs text-muted-foreground">
                {{ event.project }}
              </div>
            </div>
          </button>
        </div>
      </ScrollArea>
    </CardContent>
  </Card>
</template>
