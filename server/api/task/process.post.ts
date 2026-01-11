import OpenAI from "openai";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const openai = new OpenAI({
    apiKey: config.openaiApiKey || process.env.NUXT_PUBLIC_OPENAI_API_KEY,
  });

  const formData = await readMultipartFormData(event);
  if (!formData) throw createError({ statusCode: 400, message: "No data" });

  const audioFile = formData.find((f) => f.name === "audio");
  if (!audioFile) throw createError({ statusCode: 400, message: "No audio file" });

  const timezoneField = formData.find((f) => f.name === "timezone");
  const timezone = timezoneField?.data ? String(timezoneField.data) : "Unknown";

  // Optional project list to help mapping
  const projectsField = formData.find((f) => f.name === "projects");
  let projectList: string[] = [];
  if (projectsField && projectsField.data) {
    try {
      projectList = JSON.parse(projectsField.data.toString());
    } catch {
      projectList = [];
    }
  }

  // 1. Transcribe
  // `audioFile.data` is a Node Buffer; convert to Uint8Array for DOM `BlobPart` compatibility
  const audioBytes = new Uint8Array(audioFile.data);
  const transcription = await openai.audio.transcriptions.create({
    file: new File([audioBytes], "audio.webm", { type: "audio/webm" }),
    model: "whisper-1",
  });

  const text = transcription.text;

  // 2. Extract Info with project context
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a task management assistant.
User timezone: ${timezone}
Use this known project list: [${projectList.join(", ")}].
- If the text mentions a project that matches (case-insensitive, partial is ok), return the exact name from the list.
- If no match, set project to null.
- Always return a non-empty title; if unclear, generate a concise 6-10 word summary.
Return JSON with:
  title (string)
  description (string, fuller text)
  project (string|null)
  priority (one of: low, medium, high, urgent)
  tags (string array)
  deadline (ISO string or null)  // due date/time
  start_at (ISO string or null)  // scheduled start time (task time block)
  end_at (ISO string or null)    // scheduled end time (task time block)

Rules:
- If the user specifies a time block (e.g. "tomorrow 3-5pm", "for 2 hours at 4pm"), set start_at/end_at.
- If only start time is given, assume 1 hour duration for end_at.
- If the user specifies a due date ("by Friday", "deadline Monday"), set deadline.
- If both are mentioned, return both.

Text: "${text}"`,
      },
    ],
    response_format: { type: "json_object" },
  });

  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }

  type Extracted = {
    title?: string;
    description?: string;
    project?: string | null;
    priority?: "low" | "medium" | "high" | "urgent";
    tags?: string[];
    deadline?: string | null;
    start_at?: string | null;
    end_at?: string | null;
  };

  let extracted: Extracted = {};
  try {
    const parsed: unknown = JSON.parse(response.choices[0].message.content || "{}");
    if (isRecord(parsed)) {
      extracted = parsed as Extracted;
    }
  } catch {
    extracted = {};
  }

  // Safety fallback for title
  if (!extracted.title || typeof extracted.title !== "string" || !extracted.title.trim()) {
    const fallbackTitle = text.split(" ").slice(0, 8).join(" ").trim() || "Untitled task";
    extracted = { ...extracted, title: fallbackTitle };
  }

  // Prefer full transcript when description is missing or too short
  const desc = extracted.description || "";
  if (!desc || desc.length < Math.max(40, text.length * 0.6)) {
    extracted.description = text;
  }

  return {
    text,
    extracted,
  };
});
