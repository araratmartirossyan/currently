import OpenAI from "openai";

type ImportKind = "ics" | "text" | "image";

type ParsedEvent = {
  title: string;
  description?: string | null;
  location?: string | null;
  start_at: string; // ISO
  end_at: string; // ISO
  is_all_day: boolean;
  rrule?: string | null;
  exdates?: string[] | null;
  source: "import";
  source_uid?: string | null;
  raw_payload?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

type IcsEventBuilder = {
  uid?: string;
  title?: string;
  description?: string | null;
  location?: string | null;
  start_at?: string;
  end_at?: string;
  is_all_day?: boolean;
  rrule?: string | null;
  exdates?: string[] | null;
  raw_payload?: string | null;
};

function unfoldIcsLines(input: string) {
  const raw = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const out: string[] = [];
  for (const line of raw) {
    if (!line) continue;
    if ((line.startsWith(" ") || line.startsWith("\t")) && out.length) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

function parseIcsDate(value: string): { isAllDay: boolean; startIso: string } | null {
  const v = value.trim();
  // All-day: YYYYMMDD
  if (/^\d{8}$/.test(v)) {
    const y = Number(v.slice(0, 4));
    const m = Number(v.slice(4, 6));
    const d = Number(v.slice(6, 8));
    const dt = new Date(y, m - 1, d, 0, 0, 0);
    return { isAllDay: true, startIso: dt.toISOString() };
  }

  // Date-time: YYYYMMDDTHHMMSSZ or YYYYMMDDTHHMMSS
  const match = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (match) {
    const [, y, mo, d, hh, mm, ss, z] = match;
    const iso = `${y}-${mo}-${d}T${hh}:${mm}:${ss}${z ? "Z" : ""}`;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    return { isAllDay: false, startIso: date.toISOString() };
  }

  // Fallback: try Date parsing (handles ISO-ish)
  const fallback = new Date(v);
  if (!Number.isNaN(fallback.getTime())) return { isAllDay: false, startIso: fallback.toISOString() };
  return null;
}

function parseIcs(icsText: string): ParsedEvent[] {
  const lines = unfoldIcsLines(icsText);
  const events: ParsedEvent[] = [];
  let current: IcsEventBuilder | null = null;
  let inEvent = false;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      inEvent = false;
      if (current?.start_at) {
        const startIso = current.start_at as string;
        const endIso = (current.end_at as string) || startIso;
        events.push({
          title: current.title || "Untitled meeting",
          description: current.description ?? null,
          location: current.location ?? null,
          start_at: startIso,
          end_at: endIso,
          is_all_day: Boolean(current.is_all_day),
          rrule: current.rrule ?? null,
          exdates: current.exdates ?? null,
          source: "import",
          source_uid: current.uid ?? null,
          raw_payload: current.raw_payload ?? null,
        });
      }
      current = null;
      continue;
    }
    if (!inEvent || !current) continue;

    const [left, ...rest] = line.split(":");
    const value = rest.join(":"); // in case value contains ':'
    if (!value) continue;

    const [propWithParams] = left.split(";");
    const prop = propWithParams.toUpperCase();

    if (prop === "UID") current.uid = value.trim();
    if (prop === "SUMMARY") current.title = value.trim();
    if (prop === "DESCRIPTION") current.description = value.trim();
    if (prop === "LOCATION") current.location = value.trim();
    if (prop === "RRULE") current.rrule = value.trim();

    if (prop === "EXDATE") {
      const parts = value.split(",").map((s) => s.trim()).filter(Boolean);
      const parsed = parts
        .map((p) => parseIcsDate(p))
        .filter(Boolean)
        .map((p) => (p as { isAllDay: boolean; startIso: string }).startIso);
      current.exdates = parsed.length ? parsed : null;
    }

    if (prop === "DTSTART") {
      const parsed = parseIcsDate(value);
      if (parsed) {
        current.start_at = parsed.startIso;
        current.is_all_day = parsed.isAllDay;
      }
    }

    if (prop === "DTEND") {
      const parsed = parseIcsDate(value);
      if (parsed) {
        current.end_at = parsed.startIso;
      }
    }

    // Keep raw VEVENT-ish payload for debugging/import provenance
    current.raw_payload = (current.raw_payload ? current.raw_payload + "\n" : "") + line;
  }

  // Normalize all-day DTEND semantics: many ICS use exclusive DTEND date for all-day events
  for (const e of events) {
    if (!e.is_all_day) continue;
    // If end_at == start_at, set to +1 day for display
    if (e.end_at === e.start_at) {
      const d = new Date(e.start_at);
      d.setDate(d.getDate() + 1);
      e.end_at = d.toISOString();
    }
  }

  return events;
}

async function parseWithAiTextOrImage(args: {
  kind: ImportKind;
  text?: string;
  imageBase64?: string;
  timezone?: string;
}): Promise<ParsedEvent[]> {
  const config = useRuntimeConfig();
  const apiKey = config.openaiApiKey || process.env.NUXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) throw createError({ statusCode: 500, statusMessage: "Missing OPENAI key" });

  const client = new OpenAI({ apiKey });
  const userTz = "User timezone: " + (args.timezone || "Unknown");

  const system = [
    "Extract calendar MEETINGS from the user's input.",
    "Return JSON ONLY with shape: { events: Array<{ title, start_at, end_at, is_all_day, location?, description?, rrule?, source_uid? }> }",
    "start_at/end_at must be ISO 8601 strings (include timezone offset or Z).",
    "If only a date is known, set is_all_day=true and use midnight-to-midnight (end next day).",
    "If times are ambiguous, assume user local timezone.",
    "If a provider UID is visible, put it into source_uid.",
  ].join("\n");

  const input =
    args.kind === "text"
      ? [{ type: "text" as const, text: `${userTz}\n\n${args.text || ""}` }]
      : [
          { type: "text" as const, text: `${userTz}\n\nExtract meetings from this screenshot.` },
          {
            type: "image_url" as const,
            image_url: { url: `data:image/png;base64,${args.imageBase64}` },
          },
        ];

  const resp = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0,
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content:
          input as unknown as Parameters<typeof client.chat.completions.create>[0]["messages"][number]["content"],
      },
    ],
  });

  const raw = resp.choices[0]?.message?.content || "{}";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { events: [] } as unknown;
  }
  const maybeEvents = isRecord(parsed) ? parsed.events : undefined;
  const events = Array.isArray(maybeEvents) ? maybeEvents : [];

  return events
    .filter(
      (e): e is {
        title: unknown;
        start_at: unknown;
        end_at: unknown;
        is_all_day?: unknown;
        location?: unknown;
        description?: unknown;
        rrule?: unknown;
        source_uid?: unknown;
      } =>
        typeof e === "object" &&
        e !== null &&
        "title" in e &&
        "start_at" in e &&
        "end_at" in e
    )
    .map((e) => ({
      title: String(e.title),
      description: e.description ? String(e.description) : null,
      location: e.location ? String(e.location) : null,
      start_at: new Date(String(e.start_at)).toISOString(),
      end_at: new Date(String(e.end_at)).toISOString(),
      is_all_day: Boolean(e.is_all_day),
      rrule: e.rrule ? String(e.rrule) : null,
      exdates: null,
      source: "import" as const,
      source_uid: e.source_uid ? String(e.source_uid) : null,
      raw_payload: args.kind === "text" ? args.text || null : "screenshot_import",
    }));
}

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event);
  if (!form) throw createError({ statusCode: 400, statusMessage: "Missing form data" });

  const textField = form.find((p) => p.name === "text");
  const icsFile = form.find((p) => p.name === "ics" && "data" in p);
  const imageFile = form.find((p) => p.name === "image" && "data" in p);
  const tzField = form.find((p) => p.name === "timezone");
  const timezone = tzField?.data ? String(tzField.data) : undefined;

  if (icsFile && "data" in icsFile) {
    const icsText = Buffer.from(icsFile.data).toString("utf-8");
    const parsed = parseIcs(icsText);
    // Ensure upsert by UID if present
    return { events: parsed };
  }

  if (textField?.data) {
    const text = String(textField.data);
    const parsed = await parseWithAiTextOrImage({ kind: "text", text, timezone });
    return { events: parsed };
  }

  if (imageFile && "data" in imageFile) {
    const b64 = Buffer.from(imageFile.data).toString("base64");
    const parsed = await parseWithAiTextOrImage({ kind: "image", imageBase64: b64, timezone });
    return { events: parsed };
  }

  throw createError({ statusCode: 400, statusMessage: "Provide ics, text, or image" });
});

