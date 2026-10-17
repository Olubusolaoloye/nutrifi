// Shared validators so the schema, mutations and import stay in step with the app's types.
import { v } from "convex/values";

export const role = v.union(v.literal("consumer"), v.literal("student"), v.literal("dietitian"));
export const verification = v.union(v.literal("none"), v.literal("pending"), v.literal("verified"), v.literal("rejected"));
export const sex = v.union(v.literal("female"), v.literal("male"));
export const activity = v.union(v.literal("sedentary"), v.literal("light"), v.literal("moderate"), v.literal("vigorous"));
export const goal = v.union(v.literal("lose"), v.literal("maintain"), v.literal("gain"), v.literal("eat_healthier"));
export const condition = v.union(
  v.literal("diabetes"),
  v.literal("hypertension"),
  v.literal("kidney_disease"),
  v.literal("pregnant"),
  v.literal("breastfeeding"),
);
export const meal = v.union(v.literal("Breakfast"), v.literal("Lunch"), v.literal("Dinner"), v.literal("Snacks"));
export const noteSlot = v.union(meal, v.literal("Day"));
export const eventType = v.union(v.literal("meal"), v.literal("activity"), v.literal("appointment"));
export const exerciseStatus = v.union(v.literal("completed"), v.literal("planned"), v.literal("skipped"));
/** YYYY-MM-DD */
export const isoDate = v.string();

export const profileFields = {
  name: v.string(),
  sex,
  birthDate: isoDate,
  heightCm: v.number(),
  activity,
  goal,
  conditions: v.array(condition),
};

export const diaryFields = {
  date: isoDate,
  meal,
  foodId: v.string(),
  grams: v.number(),
  portionLabel: v.string(),
  loggedAt: v.optional(v.string()),
};

export const noteFields = {
  feeling: v.optional(v.number()),
  tags: v.array(v.string()),
  text: v.string(),
};

export const eventFields = {
  date: isoDate,
  time: v.string(),
  type: eventType,
  title: v.string(),
  location: v.optional(v.string()),
  note: v.optional(v.string()),
};

export const exerciseFields = {
  date: isoDate,
  activityId: v.string(),
  minutes: v.number(),
  sets: v.optional(v.number()),
  reps: v.optional(v.number()),
  status: exerciseStatus,
};

const cuisine = v.union(v.literal("Nigerian"), v.literal("Continental"), v.literal("International"));
const allergen = v.union(v.literal("egg"), v.literal("dairy"), v.literal("peanut"), v.literal("fish"), v.literal("shellfish"), v.literal("gluten"));

/** Mirrors PlanPrefs in src/lib/planner.ts. */
export const planPrefs = v.object({
  cuisines: v.array(cuisine),
  diet: v.union(v.literal("any"), v.literal("pescatarian"), v.literal("vegetarian")),
  avoid: v.array(allergen),
  budgetPerDay: v.union(v.number(), v.null()),
});

const timed = v.object({ on: v.boolean(), time: v.string() });
const weekly = v.object({ on: v.boolean(), day: v.number(), time: v.string() });

/** Mirrors ReminderSettings in src/lib/reminders.ts. */
export const reminderSettings = v.object({
  push: v.boolean(),
  whatsapp: v.boolean(),
  meals: v.object({ Breakfast: timed, Lunch: timed, Dinner: timed, Snacks: timed }),
  water: v.object({ on: v.boolean(), everyHours: v.number(), from: v.string(), to: v.string() }),
  weighIn: weekly,
  planning: weekly,
  appointments: v.object({ on: v.boolean(), minutesBefore: v.number() }),
  utcOffsetMinutes: v.number(),
});
