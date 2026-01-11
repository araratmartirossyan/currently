import { computed } from "vue";
import { useForm, useField } from "vee-validate";
import * as yup from "yup";
import type { Project } from "@/types";
import { TaskPriority, TaskStatus } from "@/types";
import type { VoiceNoteResponse } from "@/composables/useVoiceNote";
import type { Database } from "~/types/database.types";
import { isoToDateTimeLocalInput } from "@/helpers/datetime/inputs";

export type TaskFormValues = {
  title: string;
  description: string;
  project_id: string; // "none" or uuid
  priority: TaskPriority;
  status: TaskStatus;
  category: string;
  subcategory: string;
  // datetime-local input string: "YYYY-MM-DDTHH:mm" or ""
  start_at: string;
  end_at: string;
};

const schema = yup.object({
  title: yup.string().required("Title is required"),
  description: yup.string().optional(),
  project_id: yup.string().optional(),
  priority: yup.mixed<TaskPriority>().oneOf(Object.values(TaskPriority)).required(),
  status: yup.mixed<TaskStatus>().oneOf(Object.values(TaskStatus)).required(),
  category: yup.string().optional(),
  subcategory: yup.string().optional(),
  start_at: yup.string().optional(),
  end_at: yup.string().optional(),
});

type Options = {
  initialValues?: Partial<TaskFormValues>;
};

export function useTaskForm(options: Options = {}) {
  const { handleSubmit, setValues, resetForm } = useForm<TaskFormValues>({
    validationSchema: schema,
    initialValues: {
      title: "",
      description: "",
      project_id: "none",
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.PENDING,
      category: "",
      subcategory: "",
      start_at: "",
      end_at: "",
      ...options.initialValues,
    },
  });

  const { value: title } = useField<string>("title");
  const { value: description } = useField<string>("description");
  const { value: project_id } = useField<string>("project_id");
  const { value: priority } = useField<TaskPriority>("priority");
  const { value: status } = useField<TaskStatus>("status");
  const { value: category } = useField<string>("category");
  const { value: subcategory } = useField<string>("subcategory");
  const { value: start_at } = useField<string>("start_at");
  const { value: end_at } = useField<string>("end_at");

  function applyVoiceResult(response: VoiceNoteResponse | null | undefined, projects: Project[]) {
    if (!response?.extracted) return;

    const matched = response.extracted.project
      ? projects.find(
          (p) => p.name.toLowerCase() === String(response.extracted?.project).toLowerCase()
        )
      : null;

    const transcript = response.text || "";
    const descFromAi = response.extracted.description || "";
    const descriptionValue =
      !descFromAi || descFromAi.length < Math.max(40, transcript.length * 0.6)
        ? transcript || descFromAi
        : descFromAi;

    setValues({
      title: response.extracted.title || title.value,
      description: descriptionValue || description.value,
      project_id: matched ? matched.id : project_id.value,
      priority: response.extracted.priority || priority.value,
      status: status.value,
      category: category.value || "",
      subcategory: subcategory.value || "",
      start_at: response.extracted.start_at
        ? isoToDateTimeLocalInput(response.extracted.start_at)
        : start_at.value || "",
      end_at: response.extracted.end_at
        ? isoToDateTimeLocalInput(response.extracted.end_at)
        : end_at.value || "",
    });
  }

  function toInsert(values: TaskFormValues): Database["public"]["Tables"]["tasks"]["Insert"] {
    const projectId = values.project_id === "none" ? null : values.project_id;
    return {
      title: values.title,
      description: values.description || null,
      project_id: projectId,
      category: values.category?.trim() ? values.category.trim() : null,
      subcategory: values.subcategory?.trim() ? values.subcategory.trim() : null,
      start_at: values.start_at ? new Date(values.start_at).toISOString() : null,
      end_at: values.end_at ? new Date(values.end_at).toISOString() : null,
      priority: values.priority,
      status: values.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attachments: [],
      tags: [],
    };
  }

  function toUpdate(
    values: Partial<TaskFormValues>
  ): Database["public"]["Tables"]["tasks"]["Update"] {
    // Only send defined keys (avoid overwriting with undefined)
    const payload: Database["public"]["Tables"]["tasks"]["Update"] = {};
    if (values.title !== undefined) payload.title = values.title;
    if (values.description !== undefined) payload.description = values.description || null;
    if (values.project_id !== undefined)
      payload.project_id = values.project_id === "none" ? null : values.project_id;
    if (values.category !== undefined)
      payload.category = values.category?.trim() ? values.category.trim() : null;
    if (values.subcategory !== undefined)
      payload.subcategory = values.subcategory?.trim() ? values.subcategory.trim() : null;
    if (values.start_at !== undefined)
      payload.start_at = values.start_at ? new Date(values.start_at).toISOString() : null;
    if (values.end_at !== undefined)
      payload.end_at = values.end_at ? new Date(values.end_at).toISOString() : null;
    if (values.priority !== undefined) payload.priority = values.priority;
    if (values.status !== undefined) payload.status = values.status;
    payload.updated_at = new Date().toISOString();
    return payload;
  }

  const isValidTitle = computed(() => Boolean(title.value?.trim()));

  return {
    // vee-validate
    handleSubmit,
    setValues,
    resetForm,

    // fields
    title,
    description,
    project_id,
    priority,
    status,
    category,
    subcategory,
    start_at,
    end_at,

    // helpers
    isValidTitle,
    applyVoiceResult,
    toInsert,
    toUpdate,
  };
}
