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
import { toast } from "vue-sonner";
import { useCalendarEventsStore } from "@/stores/calendarEvents";
import { useVoiceMeeting } from "@/composables/useVoiceMeeting";
import { Mic, Square, Loader2 } from "lucide-vue-next";
import { VueDatePicker } from "@vuepic/vue-datepicker";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const store = useCalendarEventsStore();

const title = ref("");
const startDate = ref<Date | null>(null);
const endDate = ref<Date | null>(null);
const isAllDay = ref(false);
const location = ref("");
const description = ref("");
const isSubmitting = ref(false);

const { isRecording, isProcessing, result, startRecording, stopRecording } = useVoiceMeeting();

watch(
  () => props.open,
  (o) => {
    if (!o) return;
    title.value = "";
    location.value = "";
    description.value = "";
    isAllDay.value = false;
    startDate.value = new Date();
    endDate.value = new Date(Date.now() + 60 * 60 * 1000);
  },
  { immediate: true }
);

watch(
  result,
  (r) => {
    if (!r?.extracted) return;
    const e = r.extracted;
    if (e.title) title.value = e.title;
    if (e.location !== undefined) location.value = e.location || "";
    if (e.description !== undefined) description.value = e.description || "";
    if (typeof e.is_all_day === "boolean") isAllDay.value = e.is_all_day;
    if (e.start_at) startDate.value = new Date(e.start_at);
    if (e.end_at) endDate.value = new Date(e.end_at);
    toast.success("Meeting info extracted!");
  },
  { deep: true }
);

const canSubmit = computed(() => Boolean(title.value.trim() && startDate.value && endDate.value));

function toLocalMidnight(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

async function onCreate() {
  if (!canSubmit.value) return;
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
      // all-day end is exclusive → +1 day
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

    const created = await store.createEvent({
      title: title.value.trim(),
      location: location.value.trim() || null,
      description: description.value.trim() || null,
      start_at: startIso,
      end_at: endIso,
      is_all_day: isAllDay.value,
      source: "manual",
      source_uid: null,
      raw_payload: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    toast.success(`Created “${created.title}”`);
    emit("close");
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to create meeting";
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
        <DialogTitle>New meeting</DialogTitle>
      </DialogHeader>

      <div class="space-y-4">
        <div
          class="bg-muted/30 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4"
        >
          <Button
            size="lg"
            :variant="isRecording ? 'destructive' : 'default'"
            class="flex size-14 flex-col gap-1 rounded-full"
            @click="isRecording ? stopRecording() : startRecording()"
            :disabled="isProcessing"
          >
            <component :is="isRecording ? Square : Mic" class="size-6" />
          </Button>
          <p class="mt-2 text-sm font-medium">
            {{ isRecording ? "Recording... click to stop" : "Create with voice" }}
          </p>
          <div v-if="isProcessing" class="text-primary mt-2 flex items-center gap-2 text-sm">
            <Loader2 class="size-4 animate-spin" />
            Processing with AI...
          </div>
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
              :teleport="true"
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
              :teleport="true"
              :auto-apply="true"
              :text-input="true"
              :is-24="true"
            />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <input id="allDay" v-model="isAllDay" type="checkbox" class="h-4 w-4 cursor-pointer" />
          <label for="allDay" class="cursor-pointer text-sm">All day</label>
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
        <Button variant="outline" :disabled="isSubmitting" @click="emit('close')">Cancel</Button>
        <Button :disabled="isSubmitting || !canSubmit" @click="onCreate">Create</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
