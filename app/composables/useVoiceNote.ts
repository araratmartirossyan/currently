import { computed, ref, type Ref } from "vue";
import { toast } from "vue-sonner";
import { aiService } from "@/services/ai";
import type { TaskPriority } from "@/types";

export type VoiceNoteResponse = {
  text?: string;
  extracted?: {
    title?: string;
    description?: string;
    project?: string | null;
    priority?: TaskPriority;
    tags?: string[];
    deadline?: string | null;
  };
};

type Options = {
  projectNames?: Ref<string[]>;
  onResult?: (result: VoiceNoteResponse) => void;
};

export function useVoiceNote(options: Options = {}) {
  const isRecording = ref(false);
  const isProcessing = ref(false);
  const error = ref<string | null>(null);
  const result = ref<VoiceNoteResponse | null>(null);

  const mediaRecorder = ref<MediaRecorder | null>(null);
  const audioChunks = ref<Blob[]>([]);

  const projectNames = computed(() => options.projectNames?.value ?? []);

  async function processFile(file: File) {
    if (import.meta.server) return;
    isProcessing.value = true;
    error.value = null;
    try {
      toast.info("Processing voice note...");
      const response = (await aiService.processVoiceNote(
        file,
        projectNames.value
      )) as VoiceNoteResponse;
      result.value = response;
      options.onResult?.(response);
      return response;
    } catch (e) {
      console.error("AI processing failed", e);
      error.value = "Failed to process voice note";
      toast.error(error.value);
      return null;
    } finally {
      isProcessing.value = false;
    }
  }

  async function startRecording() {
    if (import.meta.server) return;
    error.value = null;
    result.value = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.value = new MediaRecorder(stream);
      audioChunks.value = [];

      mediaRecorder.value.ondataavailable = (event) => {
        audioChunks.value.push(event.data);
      };

      mediaRecorder.value.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunks.value, { type: "audio/webm" });
          const file = new File([audioBlob], "recording.webm", { type: "audio/webm" });
          await processFile(file);
        } finally {
          // Ensure mic is released
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.value.start();
      isRecording.value = true;
    } catch (e) {
      console.error("Error accessing microphone", e);
      error.value = "Could not access microphone";
      toast.error(error.value);
      isRecording.value = false;
    }
  }

  function stopRecording() {
    if (import.meta.server) return;
    if (!mediaRecorder.value || !isRecording.value) return;
    mediaRecorder.value.stop();
    isRecording.value = false;
  }

  return {
    isRecording,
    isProcessing,
    error,
    result,
    startRecording,
    stopRecording,
    processFile,
  };
}
