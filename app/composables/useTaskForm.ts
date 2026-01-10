import { computed } from "vue";
import { useForm, useField } from "vee-validate";
import * as yup from "yup";
import type { Project, TaskPriority, TaskStatus } from "@/types";
import type { VoiceNoteResponse } from "@/composables/useVoiceNote";
import type { Database } from "~/types/database.types";

export type TaskFormValues = {
  title: string;
  description: string;
  project_id: string; // "none" or uuid
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  category: string;
  subcategory: string;
  // date input string: "YYYY-MM-DD" or ""
  deadline: string;
};

const schema = yup.object({
  title: yup.string().required("Title is required"),
  description: yup.string().optional(),
  project_id: yup.string().optional(),
  priority: yup
    .mixed<TaskFormValues["priority"]>()
    .oneOf(["low", "medium", "high", "urgent"])
    .required(),
  status: yup
    .mixed<TaskFormValues["status"]>()
    .oneOf(["pending", "in_progress", "completed", "cancelled"])
    .required(),
  category: yup.string().optional(),
  subcategory: yup.string().optional(),
  deadline: yup.string().optional(),
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
      priority: "medium",
      status: "pending",
      category: "",
      subcategory: "",
      deadline: "",
      ...options.initialValues,
    },
  });

  const { value: title } = useField<string>("title");
  const { value: description } = useField<string>("description");
  const { value: project_id } = useField<string>("project_id");
  const { value: priority } = useField<TaskFormValues["priority"]>("priority");
  const { value: status } = useField<TaskFormValues["status"]>("status");
  const { value: category } = useField<string>("category");
  const { value: subcategory } = useField<string>("subcategory");
  const { value: deadline } = useField<string>("deadline");

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
      priority: (response.extracted.priority as TaskFormValues["priority"]) || priority.value,
      status: status.value,
      category: category.value || "",
      subcategory: subcategory.value || "",
      deadline: deadline.value || "",
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
      deadline: values.deadline ? new Date(values.deadline).toISOString() : null,
      priority: values.priority as TaskPriority,
      status: values.status as TaskStatus,
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
    if (values.deadline !== undefined)
      payload.deadline = values.deadline ? new Date(values.deadline).toISOString() : null;
    if (values.priority !== undefined) payload.priority = values.priority as TaskPriority;
    if (values.status !== undefined) payload.status = values.status as TaskStatus;
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
    deadline,

    // helpers
    isValidTitle,
    applyVoiceResult,
    toInsert,
    toUpdate,
  };
}
