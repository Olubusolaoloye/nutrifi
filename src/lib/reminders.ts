// Reminder settings and the "what's due now?" logic. Plain TypeScript with no app imports, so the
// browser (on-device reminders) and the Convex server (push + WhatsApp) use exactly the same rules.

export type ReminderMeal = "Breakfast" | "Lunch" | "Dinner" | "Snacks";
export const REMINDER_MEALS: ReminderMeal[] = ["Breakfast", "Lunch", "Dinner", "Snacks"];

export interface TimedReminder {
  on: boolean;
  /** HH:MM, local time. */
  time: string;
}

export interface WeeklyReminder extends TimedReminder {
  /** 0 = Sunday … 6 = Saturday. */
  day: number;
}

export interface ReminderSettings {
  /** Channels. */
  push: boolean;
  whatsapp: boolean;
  meals: Record<ReminderMeal, TimedReminder>;
  water: { on: boolean; everyHours: number; from: string; to: string };
  weighIn: WeeklyReminder;
  planning: WeeklyReminder;
  appointments: { on: boolean; minutesBefore: number };
  /** The member's offset from UTC in minutes (Lagos: 60). Taken from their device. */
  utcOffsetMinutes: number;
}

export const DEFAULT_REMINDERS: ReminderSettings = {
  push: false,
  whatsapp: false,
  meals: {
    Breakfast: { on: true, time: "07:30" },
    Lunch: { on: true, time: "13:00" },
    Dinner: { on: true, time: "19:00" },
    Snacks: { on: false, time: "16:00" },
  },
  water: { on: true, everyHours: 2, from: "08:00", to: "20:00" },
  weighIn: { on: true, day: 1, time: "07:00" },
  planning: { on: true, day: 0, time: "17:00" },
  appointments: { on: true, minutesBefore: 60 },
  utcOffsetMinutes: 60,
};

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const isTime = (t: string) => TIME.test(t);
export const toMinutes = (t: string) => {
  const m = TIME.exec(t);
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
};
const hhmm = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

/** Water reminder times between `from` and `to`, every `everyHours`. */
export function waterTimes(w: ReminderSettings["water"]): string[] {
  const start = toMinutes(w.from);
  const end = toMinutes(w.to);
  const step = Math.round(w.everyHours * 60);
  if (!Number.isFinite(start) || !Number.isFinite(end) || step < 30) return [];
  const out: string[] = [];
  for (let t = start; t <= end && out.length < 24; t += step) out.push(hhmm(t));
  return out;
}

/** Problems with a settings object, or [] if it's valid. Used by the server before saving. */
export function validateReminders(s: ReminderSettings): string[] {
  const errors: string[] = [];
  const times = [...REMINDER_MEALS.map((m) => s.meals[m]?.time), s.water.from, s.water.to, s.weighIn.time, s.planning.time];
  if (times.some((t) => typeof t !== "string" || !isTime(t))) errors.push("Times must be HH:MM.");
  if (!(s.water.everyHours >= 1 && s.water.everyHours <= 6)) errors.push("Water reminders: every 1 to 6 hours.");
  if (toMinutes(s.water.to) < toMinutes(s.water.from)) errors.push("Water reminders: the end time must be after the start.");
  for (const d of [s.weighIn.day, s.planning.day]) if (!Number.isInteger(d) || d < 0 || d > 6) errors.push("Day must be 0–6.");
  if (!(s.appointments.minutesBefore >= 5 && s.appointments.minutesBefore <= 24 * 60)) errors.push("Appointment reminders: 5 minutes to 24 hours before.");
  if (!Number.isInteger(s.utcOffsetMinutes) || Math.abs(s.utcOffsetMinutes) > 14 * 60) errors.push("Invalid time zone offset.");
  return errors;
}

export interface ReminderMessage {
  /** Unique per occurrence, used so each reminder is only sent once. */
  key: string;
  title: string;
  body: string;
  /** Page to open when tapped. */
  url: string;
}

export interface ReminderContext {
  /** Planned dish per meal for the local day, already formatted (e.g. "Jollof rice (1½ servings)"). */
  plan: Partial<Record<ReminderMeal, string>>;
  /** Calendar events (local date and time). */
  events: Array<{ id: string; date: string; time: string; title: string; type: string }>;
  waterMl: number;
  waterTargetMl: number | null;
}

/** Local date (YYYY-MM-DD), minutes since local midnight and weekday for a UTC instant. */
export function localParts(nowMs: number, utcOffsetMinutes: number) {
  const d = new Date(nowMs + utcOffsetMinutes * 60_000);
  return {
    date: d.toISOString().slice(0, 10),
    minutes: d.getUTCHours() * 60 + d.getUTCMinutes(),
    weekday: d.getUTCDay(),
  };
}

/** "Local wall-clock" milliseconds for a date + time, comparable with nowMs + offset. */
const localMs = (date: string, time: string) => Date.parse(`${date}T${time}:00Z`);

/**
 * Reminders due at `nowMs`: anything scheduled in the last `windowMinutes` (so a late run still sends it).
 * Callers keep a log of sent keys so each one goes out once.
 */
export function dueReminders(s: ReminderSettings, nowMs: number, ctx: ReminderContext, windowMinutes = 15): ReminderMessage[] {
  const { date, minutes, weekday } = localParts(nowMs, s.utcOffsetMinutes);
  const due = (time: string) => {
    const t = toMinutes(time);
    return Number.isFinite(t) && minutes >= t && minutes < t + windowMinutes;
  };
  const out: ReminderMessage[] = [];

  for (const meal of REMINDER_MEALS) {
    const r = s.meals[meal];
    if (!r?.on || !due(r.time)) continue;
    const planned = ctx.plan[meal];
    const label = meal === "Snacks" ? "Snack" : meal;
    out.push({
      key: `${date}|meal|${meal}`,
      title: `${label} time 🍽️`,
      body: planned ? `On your plan: ${planned}. Log it in your diary when you eat.` : `Remember to log your ${label.toLowerCase()} in your food diary.`,
      url: planned ? "/plan" : "/add",
    });
  }

  if (s.water.on && (ctx.waterTargetMl === null || ctx.waterMl < ctx.waterTargetMl)) {
    const time = waterTimes(s.water).find(due);
    if (time) {
      const progress = ctx.waterTargetMl ? ` You've had ${(ctx.waterMl / 1000).toFixed(1)} of ${(ctx.waterTargetMl / 1000).toFixed(1)} L today.` : "";
      out.push({ key: `${date}|water|${time}`, title: "Time for some water 💧", body: `Have a glass or a sachet of water.${progress}`, url: "/home" });
    }
  }

  if (s.weighIn.on && weekday === s.weighIn.day && due(s.weighIn.time)) {
    out.push({ key: `${date}|weigh`, title: "Weekly weigh-in ⚖️", body: "Weigh yourself before breakfast and log it to see your progress.", url: "/progress" });
  }

  if (s.planning.on && weekday === s.planning.day && due(s.planning.time)) {
    out.push({ key: `${date}|planning`, title: "Plan your week 🗓️", body: "Fill next week's meal plan and get your grocery list ready.", url: "/plan" });
  }

  if (s.appointments.on) {
    const now = nowMs + s.utcOffsetMinutes * 60_000;
    for (const e of ctx.events) {
      const at = localMs(e.date, e.time);
      if (!Number.isFinite(at)) continue;
      const remindAt = at - s.appointments.minutesBefore * 60_000;
      if (now >= remindAt && now < remindAt + windowMinutes * 60_000 && now < at) {
        out.push({ key: `event|${e.id}|${e.date}T${e.time}`, title: `Coming up at ${e.time}`, body: e.title, url: "/calendar" });
      }
    }
  }
  return out;
}

/** Nigerian numbers in any common format → E.164 (+234…). Other countries must start with +. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[\s()-]/g, "");
  let e164: string;
  if (/^\+\d{8,15}$/.test(digits)) e164 = digits;
  else if (/^0[789][01]\d{8}$/.test(digits)) e164 = `+234${digits.slice(1)}`;
  else if (/^234[789][01]\d{8}$/.test(digits)) e164 = `+${digits}`;
  else return null;
  if (e164.startsWith("+234") && !/^\+234[789][01]\d{8}$/.test(e164)) return null;
  return e164;
}
