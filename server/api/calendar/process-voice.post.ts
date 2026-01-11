import OpenAI from "openai";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const apiKey = config.openaiApiKey || process.env.NUXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) throw createError({ statusCode: 500, statusMessage: "Missing OPENAI key" });

  const openai = new OpenAI({ apiKey });

  const formData = await readMultipartFormData(event);
  if (!formData) throw createError({ statusCode: 400, message: "No data" });

  const audioFile = formData.find((f) => f.name === "audio");
  if (!audioFile) throw createError({ statusCode: 400, message: "No audio file" });

  const timezoneField = formData.find((f) => f.name === "timezone");
  const timezone = timezoneField?.data ? String(timezoneField.data) : "Unknown";

  // 1) Transcribe
  const audioBytes = new Uint8Array(audioFile.data);
  const transcription = await openai.audio.transcriptions.create({
    file: new File([audioBytes], "audio.webm", { type: "audio/webm" }),
    model: "whisper-1",
  });

  const text = transcription.text;

  // 2) Extract meeting/event fields
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a calendar assistant.
User timezone: ${timezone}

Extract ONE meeting/event from the text.
Return JSON with:
  title (string)
  description (string|null)
  location (string|null)
  is_all_day (boolean)
  start_at (ISO string)
  end_at (ISO string)
  rrule (string|null)  // optional RRULE, if user says recurring

Rules:
- If only a date is provided, set is_all_day=true and use midnight-to-midnight (end next day).
- If only start time is provided, assume 1 hour duration for end_at.
- Use the user's timezone for relative dates ("tomorrow", "next Monday") and ambiguous times.`,
      },
      { role: "user", content: text },
    ],
  });

  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }

  let extracted: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(response.choices[0].message.content || "{}");
    if (isRecord(parsed)) extracted = parsed;
  } catch {
    extracted = {};
  }

  return { text, extracted };
});

