import { describe, expect, it } from "vitest";
import { DEFAULT_REMINDERS, dueReminders, localParts, normalizePhone, validateReminders, waterTimes, type ReminderContext } from "./reminders";

const EMPTY_CTX: ReminderContext = { plan: {}, events: [], waterMl: 0, waterTargetMl: 2500 };
/** A UTC instant for a Lagos (UTC+1) wall-clock time. */
const lagos = (date: string, time: string) => Date.parse(`${date}T${time}:00Z`) - 60 * 60_000;
const on = (patch: Partial<typeof DEFAULT_REMINDERS> = {}) => ({ ...DEFAULT_REMINDERS, ...patch });

describe("reminder times", () => {
  it("converts UTC to local time", () => {
    // 2026-10-19 is a Monday. 06:30 UTC is 07:30 in Lagos.
    expect(localParts(Date.parse("2026-10-19T06:30:00Z"), 60)).toEqual({ date: "2026-10-19", minutes: 450, weekday: 1 });
    // 23:30 UTC is already tomorrow in Lagos.
    expect(localParts(Date.parse("2026-10-19T23:30:00Z"), 60).date).toBe("2026-10-20");
  });

  it("lists water times across the day", () => {
    expect(waterTimes({ on: true, everyHours: 2, from: "08:00", to: "14:00" })).toEqual(["08:00", "10:00", "12:00", "14:00"]);
    expect(waterTimes({ on: true, everyHours: 1.5, from: "09:00", to: "12:00" })).toEqual(["09:00", "10:30", "12:00"]);
  });

  it("validates settings", () => {
    expect(validateReminders(DEFAULT_REMINDERS)).toEqual([]);
    expect(validateReminders(on({ water: { on: true, everyHours: 2, from: "20:00", to: "08:00" } }))).not.toEqual([]);
    expect(validateReminders(on({ meals: { ...DEFAULT_REMINDERS.meals, Lunch: { on: true, time: "25:00" } } }))).not.toEqual([]);
  });
});

describe("due reminders", () => {
  it("sends a meal reminder in its window, mentioning the planned dish", () => {
    const ctx = { ...EMPTY_CTX, plan: { Lunch: "Jollof rice with grilled chicken (1 serving)" } };
    const at = (t: string) => dueReminders(DEFAULT_REMINDERS, lagos("2026-10-20", t), ctx).filter((m) => m.key.includes("meal"));
    expect(at("12:59")).toEqual([]);
    const [lunch] = at("13:05");
    expect(lunch).toMatchObject({ key: "2026-10-20|meal|Lunch", url: "/plan" });
    expect(lunch.body).toContain("Jollof rice");
    expect(at("13:20")).toEqual([]);
  });

  it("skips switched-off reminders", () => {
    const s = on({ meals: { ...DEFAULT_REMINDERS.meals, Lunch: { on: false, time: "13:00" } } });
    expect(dueReminders(s, lagos("2026-10-20", "13:00"), EMPTY_CTX)).toEqual([]);
  });

  it("stops water reminders once the target is reached", () => {
    const t = lagos("2026-10-20", "10:00");
    expect(dueReminders(DEFAULT_REMINDERS, t, EMPTY_CTX).map((m) => m.key)).toEqual(["2026-10-20|water|10:00"]);
    expect(dueReminders(DEFAULT_REMINDERS, t, { ...EMPTY_CTX, waterMl: 2500 })).toEqual([]);
  });

  it("sends weekly reminders on the right day only", () => {
    // Weigh-in: Monday 07:00. Planning: Sunday 17:00.
    expect(dueReminders(DEFAULT_REMINDERS, lagos("2026-10-19", "07:00"), EMPTY_CTX).map((m) => m.key)).toContain("2026-10-19|weigh");
    expect(dueReminders(DEFAULT_REMINDERS, lagos("2026-10-20", "07:00"), EMPTY_CTX).map((m) => m.key)).not.toContain("2026-10-20|weigh");
    expect(dueReminders(DEFAULT_REMINDERS, lagos("2026-10-18", "17:00"), EMPTY_CTX).map((m) => m.key)).toContain("2026-10-18|planning");
  });

  it("reminds before appointments, even across midnight", () => {
    const ctx = { ...EMPTY_CTX, events: [{ id: "e1", date: "2026-10-21", time: "00:30", title: "Dietitian check-in", type: "appointment" }] };
    // 60 minutes before 00:30 on the 21st is 23:30 on the 20th.
    const msgs = dueReminders(DEFAULT_REMINDERS, lagos("2026-10-20", "23:35"), ctx);
    expect(msgs).toEqual([expect.objectContaining({ key: "event|e1|2026-10-21T00:30", body: "Dietitian check-in" })]);
    expect(dueReminders(DEFAULT_REMINDERS, lagos("2026-10-21", "00:31"), ctx)).toEqual([]);
  });
});

describe("phone numbers", () => {
  it("normalises Nigerian numbers", () => {
    expect(normalizePhone("0803 123 4567")).toBe("+2348031234567");
    expect(normalizePhone("2348031234567")).toBe("+2348031234567");
    expect(normalizePhone("+234 803-123-4567")).toBe("+2348031234567");
    expect(normalizePhone("+447700900123")).toBe("+447700900123");
  });

  it("rejects invalid numbers", () => {
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizePhone("+2341234")).toBeNull();
    expect(normalizePhone("08031234")).toBeNull();
  });
});

describe("alarms", () => {
  it("marks the chosen reminder types as alarms", () => {
    const lunch = (s: typeof DEFAULT_REMINDERS) => dueReminders(s, lagos("2026-10-20", "13:00"), EMPTY_CTX).find((m) => m.key.includes("Lunch"))!;
    expect(lunch(DEFAULT_REMINDERS).priority).toBe(true);
    expect(lunch(on({ alarms: { meals: false } })).priority).toBe(false);
    const water = dueReminders(DEFAULT_REMINDERS, lagos("2026-10-20", "10:00"), EMPTY_CTX)[0];
    expect(water.priority).toBe(false);
    expect(dueReminders(on({ alarms: { water: true } }), lagos("2026-10-20", "10:00"), EMPTY_CTX)[0].priority).toBe(true);
  });
});
