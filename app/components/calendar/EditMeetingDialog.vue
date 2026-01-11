<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CalendarEvent, Project } from "@/types";
import { useCalendarEventsStore } from "@/stores/calendarEvents";
import { toast } from "vue-sonner";
import { VueDatePicker } from "@vuepic/vue-datepicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildRrule, inferPreset, type RecurrencePreset } from "@/helpers/calendar/rrule";

const props = defineProps<{
  open: boolean;
  meeting: CalendarEvent | null;
  projects: Project[];
}>();

const emit = defineEmits<{ (e: "close"): void }>();

const store = useCalendarEventsStore();

const title = ref("");
const startDate = ref<Date | null>(null);
const endDate = ref<Date | null>(null);
const isAllDay = ref(false);
const projectId = ref<string>("");
const location = ref("");
const description = ref("");
const isSubmitting = ref(false);
const recurrencePreset = ref<RecurrencePreset>("none");
const recurrenceInterval = ref<string>("1");
const customRrule = ref<string>("");

watch(
  () => props.meeting,
  (m) => {
    if (!m) return;
    title.value = m.title ?? "";
    location.value = m.location ?? "";
    description.value = m.description ?? "";
    isAllDay.value = Boolean(m.is_all_day);
    projectId.value = m.project_id || "";
    startDate.value = m.start_at ? new Date(m.start_at) : null;
    endDate.value = m.end_at ? new Date(m.end_at) : null;
    const inferred = inferPreset(m.rrule);
    recurrencePreset.value = inferred.preset;
    recurrenceInterval.value = String(inferred.interval);
    customRrule.value = inferred.customRrule;
  },
  { immediate: true }
);

const canSubmit = computed(() =>
  Boolean(props.meeting?.id && title.value.trim() && projectId.value && startDate.value && endDate.value)
);

const effectiveRrule = computed<string | null>(() => {
  const interval = Math.max(1, Number(recurrenceInterval.value || 1));
  if (recurrencePreset.value === "custom") {
    const raw = customRrule.value.trim();
    return raw ? raw : null;
  }
  return buildRrule(recurrencePreset.value, interval);
});

function toLocalMidnight(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

async function onSave() {
  if (!props.meeting?.id || !canSubmit.value) return;
  isSubmitting.value = true;
  try {
    const s = startDate.value as Date;
    const e = endDate.value as Date;

    let startIso: string;
    let endIso: string;

    if (isAllDay.value) {
      const start = toLocalMidnight(s);
      const endBase = toLocalMidnight(e);
      const end = endBase.getTime() > start.getTime() ? endBase : start;
      const exclusiveEnd = new Date(end.getTime() + 24 * 60 * 60 * 1000);
      startIso = start.toISOString();
      endIso = exclusiveEnd.toISOString();
    } else {
      const startMs = s.getTime();
      const endMs = e.getTime();
      const safeEnd =
        Number.isFinite(endMs) && endMs > startMs ? e : new Date(startMs + 60 * 60 * 1000);
      startIso = s.toISOString();
      endIso = safeEnd.toISOString();
    }

    await store.updateEvent(props.meeting.id, {
      title: title.value.trim(),
      project_id: projectId.value || null,
      location: location.value.trim() || null,
      description: description.value.trim() || null,
      start_at: startIso,
      end_at: endIso,
      is_all_day: isAllDay.value,
      rrule: effectiveRrule.value,
      updated_at: new Date().toISOString(),
    });
    toast.success("Meeting updated");
    emit("close");
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to update meeting";
    toast.error(message);
  } finally {
    isSubmitting.value = false;
  }
}

async function onDelete() {
  if (!props.meeting?.id) return;
  const ok = confirm("Delete this meeting? This cannot be undone.");
  if (!ok) return;
  isSubmitting.value = true;
  try {
    await store.deleteEvent(props.meeting.id);
    toast.success("Meeting deleted");
    emit("close");
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to delete meeting";
    toast.error(message);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <Dialog
    :open="open"
    @update:open="
      (val) => {
        if (!val) emit('close');
      }
    "
  >
    <DialogContent class="sm:max-w-[640px]">
      <DialogHeader>
        <DialogTitle>Edit meeting</DialogTitle>
      </DialogHeader>

      <div class="space-y-4">
        <div class="grid gap-2">
          <label class="text-sm font-medium">Project</label>
          <Select v-model="projectId">
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="p in projects" :key="p.id" :value="p.id">
                {{ p.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Title</label>
          <Input v-model="title" placeholder="e.g. Weekly sync" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Start</label>
            <VueDatePicker
              v-model="startDate"
              :enable-time-picker="!isAllDay"
              :teleport="false"
              :auto-apply="true"
              :text-input="true"
              :is-24="true"
            />
          </div>
          <div class="grid gap-2">
            <label class="text-sm font-medium">End</label>
            <VueDatePicker
              v-model="endDate"
              :enable-time-picker="!isAllDay"
              :teleport="false"
              :auto-apply="true"
              :text-input="true"
              :is-24="true"
            />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <input
            id="allDayEdit"
            v-model="isAllDay"
            type="checkbox"
            class="h-4 w-4 cursor-pointer"
          />
          <label for="allDayEdit" class="cursor-pointer text-sm">All day</label>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Recurrence</label>
          <div class="grid grid-cols-2 gap-3">
            <Select v-model="recurrencePreset">
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="weekdays">Weekdays</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="custom">Custom RRULE</SelectItem>
              </SelectContent>
            </Select>

            <div class="grid gap-1">
              <label class="text-xs text-slate-500">Interval</label>
              <Input v-model="recurrenceInterval" type="number" min="1" class="w-full" />
            </div>
          </div>

          <Textarea
            v-if="recurrencePreset === 'custom'"
            v-model="customRrule"
            rows="2"
            placeholder="e.g. FREQ=WEEKLY;BYDAY=MO"
          />
          <p class="text-xs text-slate-500">
            Recurring meetings are stored as an iCalendar RRULE and expanded on the calendar.
          </p>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Location</label>
          <Input v-model="location" placeholder="Optional" />
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Description</label>
          <Textarea v-model="description" rows="4" placeholder="Optional" />
        </div>
      </div>

      <DialogFooter class="mt-4">
        <Button variant="destructive" :disabled="isSubmitting" @click="onDelete">Delete</Button>
        <Button variant="outline" :disabled="isSubmitting" @click="emit('close')">Cancel</Button>
        <Button :disabled="isSubmitting || !canSubmit" @click="onSave">Save</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
