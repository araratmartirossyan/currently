export type RecurrencePreset = "none" | "daily" | "weekly" | "weekdays" | "monthly" | "custom";

export function buildRrule(preset: RecurrencePreset, interval: number) {
  if (preset === "none") return null;
  if (preset === "custom") return null;

  const safeInterval =
    Number.isFinite(interval) && interval > 1 ? `;INTERVAL=${Math.floor(interval)}` : "";

  switch (preset) {
    case "daily":
      return `FREQ=DAILY${safeInterval}`;
    case "weekly":
      return `FREQ=WEEKLY${safeInterval}`;
    case "weekdays":
      return `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR${safeInterval}`;
    case "monthly":
      return `FREQ=MONTHLY${safeInterval}`;
    default:
      return null;
  }
}

export function inferPreset(rrule: string | null | undefined): {
  preset: RecurrencePreset;
  interval: number;
  customRrule: string;
} {
  const raw = (rrule || "").trim();
  if (!raw) return { preset: "none", interval: 1, customRrule: "" };

  const upper = raw.toUpperCase();
  const intervalMatch = upper.match(/(?:^|;)INTERVAL=(\d+)(?:;|$)/);
  const interval = intervalMatch ? Math.max(1, Number(intervalMatch[1])) : 1;

  // weekdays preset
  if (upper.includes("FREQ=WEEKLY") && upper.includes("BYDAY=MO,TU,WE,TH,FR")) {
    return { preset: "weekdays", interval, customRrule: raw };
  }
  if (upper.includes("FREQ=DAILY")) return { preset: "daily", interval, customRrule: raw };
  if (upper.includes("FREQ=WEEKLY")) return { preset: "weekly", interval, customRrule: raw };
  if (upper.includes("FREQ=MONTHLY")) return { preset: "monthly", interval, customRrule: raw };

  return { preset: "custom", interval, customRrule: raw };
}
