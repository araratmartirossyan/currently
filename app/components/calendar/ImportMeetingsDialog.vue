<script setup lang="ts">
import { ref } from "vue";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "vue-sonner";
import { useCalendarEventsStore } from "@/stores/calendarEvents";

defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const store = useCalendarEventsStore();

const pasteText = ref("");
const icsFile = ref<File | null>(null);
const imageFile = ref<File | null>(null);
const isSubmitting = ref(false);

const onFile = (e: Event) => {
  const target = e.target as HTMLInputElement;
  icsFile.value = target.files?.[0] || null;
};

const onImage = (e: Event) => {
  const target = e.target as HTMLInputElement;
  imageFile.value = target.files?.[0] || null;
};

async function onImport() {
  isSubmitting.value = true;
  try {
    const form = new FormData();
    form.set("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);
    if (icsFile.value) form.set("ics", icsFile.value);
    if (!icsFile.value && pasteText.value.trim()) form.set("text", pasteText.value.trim());
    if (!icsFile.value && !pasteText.value.trim() && imageFile.value) form.set("image", imageFile.value);

    const imported = await store.importFromFormData(form);
    toast.success(`Imported ${imported.length} meeting(s)`);
    pasteText.value = "";
    icsFile.value = null;
    imageFile.value = null;
    emit("close");
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Import failed";
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
        <DialogTitle>Import meetings</DialogTitle>
      </DialogHeader>

      <div class="space-y-6">
        <div class="grid gap-2">
          <label class="text-sm font-medium">Connect a calendar</label>
          <div class="flex flex-wrap gap-2">
            <Button variant="outline" disabled>Connect Google Calendar (coming soon)</Button>
            <Button variant="outline" disabled>Connect Outlook (coming soon)</Button>
          </div>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Upload .ics</label>
          <Input type="file" accept=".ics,text/calendar" @change="onFile" />
          <p class="text-muted-foreground text-xs">
            Upserts by iCalendar UID when present.
          </p>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Or paste ICS / event text</label>
          <Textarea v-model="pasteText" rows="6" placeholder="Paste ICS or event details…" />
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Or upload screenshot (AI)</label>
          <Input type="file" accept="image/*" @change="onImage" />
        </div>
      </div>

      <DialogFooter class="mt-4">
        <Button variant="outline" :disabled="isSubmitting" @click="emit('close')">Cancel</Button>
        <Button :disabled="isSubmitting" @click="onImport">Import</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

