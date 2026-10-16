// App state for the MVP prototype. Kept in the browser (localStorage) until the backend exists.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ActivityLevel, Condition, Goal, Sex } from "../lib/nutrition";

export type Role = "consumer" | "student" | "dietitian";
export type Verification = "none" | "pending" | "verified";
export type Meal = "Breakfast" | "Lunch" | "Dinner" | "Snacks";
export const MEALS: Meal[] = ["Breakfast", "Lunch", "Dinner", "Snacks"];

export interface Profile {
  name: string;
  role: Role;
  verification: Verification;
  sex: Sex;
  birthDate: string; // YYYY-MM-DD
  heightCm: number;
  activity: ActivityLevel;
  goal: Goal;
  conditions: Condition[];
}

export interface DiaryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  meal: Meal;
  foodId: string;
  grams: number;
  portionLabel: string;
  /** When it was logged (ISO). Older entries may not have it. */
  loggedAt?: string;
}

/** A note slot: one per meal, plus a whole-day reflection. */
export type NoteSlot = Meal | "Day";

export const FEELINGS = [
  { value: 1, emoji: "😣", label: "Awful" },
  { value: 2, emoji: "😕", label: "Not great" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
] as const;

export const NOTE_TAGS = [
  "Satisfied",
  "Still hungry",
  "Too full",
  "Energised",
  "Sleepy",
  "Bloated",
  "Heartburn",
  "Cravings",
  "Ate out",
  "Ate late",
] as const;

export interface DiaryNote {
  feeling?: number; // 1–5, see FEELINGS
  tags: string[];
  text: string;
  updatedAt: string; // ISO timestamp
}

export const noteKey = (date: string, slot: NoteSlot) => `${date}|${slot}`;

export interface WeightEntry {
  date: string;
  weightKg: number;
}

/** Meal plan: date → meal → recipe id. */
export type MealPlan = Record<string, Partial<Record<Meal, string>>>;

export interface GroceryState {
  people: number;
  /** Ingredient key → purchased. */
  purchased: Record<string, boolean>;
  /** Ingredient key → quantity the user changed it to. */
  qtyOverride: Record<string, number>;
}

export type EventType = "meal" | "activity" | "appointment";
export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  meal: "Meal planning",
  activity: "Physical activity",
  appointment: "Appointment",
};

export interface CalendarEvent {
  id: string;
  date: string;
  time: string; // HH:MM
  type: EventType;
  title: string;
  location?: string;
  note?: string;
}

export type ExerciseStatus = "completed" | "planned" | "skipped";

export interface ExerciseEntry {
  id: string;
  date: string;
  activityId: string;
  minutes: number;
  sets?: number;
  reps?: number;
  status: ExerciseStatus;
}

interface PersistedState {
  profile: Profile | null;
  diary: DiaryEntry[];
  water: Record<string, number>; // date → ml
  weights: WeightEntry[];
  notes: Record<string, DiaryNote>; // noteKey(date, slot) → note
  plan: MealPlan;
  grocery: GroceryState;
  events: CalendarEvent[];
  exercises: ExerciseEntry[];
}

const STORAGE_KEY = "nutrifi:v1";
const EMPTY: PersistedState = {
  profile: null,
  diary: [],
  water: {},
  weights: [],
  notes: {},
  plan: {},
  grocery: { people: 1, purchased: {}, qtyOverride: {} },
  events: [],
  exercises: [],
};

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

export const todayIso = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local time

export function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
}

/** The 7 dates (Mon–Sun) of the week containing `iso`. */
export function weekDates(iso: string): string[] {
  const d = new Date(`${iso}T12:00:00`);
  const monday = shiftDate(iso, -((d.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => shiftDate(monday, i));
}

export function ageFromBirthDate(birthDate: string, on = new Date()): number {
  const b = new Date(birthDate);
  let age = on.getFullYear() - b.getFullYear();
  const m = on.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && on.getDate() < b.getDate())) age--;
  return age;
}

interface Store extends PersistedState {
  latestWeightKg: number | null;
  completeOnboarding: (profile: Profile, weightKg: number) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  addDiaryEntries: (entries: Omit<DiaryEntry, "id">[]) => void;
  removeDiaryEntry: (id: string) => void;
  addWater: (date: string, ml: number) => void;
  logWeight: (date: string, weightKg: number) => void;
  /** Saves a note, or deletes it when `note` is null. */
  setNote: (date: string, slot: NoteSlot, note: Omit<DiaryNote, "updatedAt"> | null) => void;
  /** Sets or clears (recipeId null) one meal slot in the plan. */
  setPlanSlot: (date: string, meal: Meal, recipeId: string | null) => void;
  replacePlan: (items: Array<{ date: string; meal: Meal; recipeId: string }>) => void;
  updateGrocery: (patch: Partial<GroceryState>) => void;
  addEvent: (e: Omit<CalendarEvent, "id">) => void;
  removeEvent: (id: string) => void;
  addExercise: (e: Omit<ExerciseEntry, "id">) => void;
  updateExercise: (id: string, patch: Partial<ExerciseEntry>) => void;
  removeExercise: (id: string) => void;
  resetAll: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage unavailable (private mode); the app still works for this visit.
    }
  }, [state]);

  const logWeight = useCallback((date: string, weightKg: number) => {
    setState((s) => ({
      ...s,
      weights: [...s.weights.filter((w) => w.date !== date), { date, weightKg }].sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    }));
  }, []);

  const store = useMemo<Store>(() => {
    const latest = state.weights.at(-1);
    return {
      ...state,
      latestWeightKg: latest ? latest.weightKg : null,
      completeOnboarding: (profile, weightKg) =>
        setState((s) => ({ ...s, profile, weights: [{ date: todayIso(), weightKg }] })),
      updateProfile: (patch) => setState((s) => (s.profile ? { ...s, profile: { ...s.profile, ...patch } } : s)),
      addDiaryEntries: (entries) =>
        setState((s) => ({
          ...s,
          diary: [...s.diary, ...entries.map((e) => ({ loggedAt: new Date().toISOString(), ...e, id: crypto.randomUUID() }))],
        })),
      removeDiaryEntry: (id) => setState((s) => ({ ...s, diary: s.diary.filter((e) => e.id !== id) })),
      addWater: (date, ml) =>
        setState((s) => ({ ...s, water: { ...s.water, [date]: Math.max(0, (s.water[date] ?? 0) + ml) } })),
      logWeight,
      setNote: (date, slot, note) =>
        setState((s) => {
          const notes = { ...s.notes };
          const key = noteKey(date, slot);
          if (note) notes[key] = { ...note, updatedAt: new Date().toISOString() };
          else delete notes[key];
          return { ...s, notes };
        }),
      setPlanSlot: (date, meal, recipeId) =>
        setState((s) => {
          const day = { ...(s.plan[date] ?? {}) };
          if (recipeId) day[meal] = recipeId;
          else delete day[meal];
          return { ...s, plan: { ...s.plan, [date]: day } };
        }),
      replacePlan: (items) =>
        setState((s) => {
          const plan: MealPlan = { ...s.plan };
          for (const it of items) plan[it.date] = { ...(plan[it.date] ?? {}), [it.meal]: it.recipeId };
          return { ...s, plan };
        }),
      updateGrocery: (patch) => setState((s) => ({ ...s, grocery: { ...s.grocery, ...patch } })),
      addEvent: (e) => setState((s) => ({ ...s, events: [...s.events, { ...e, id: crypto.randomUUID() }] })),
      removeEvent: (id) => setState((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) })),
      addExercise: (e) => setState((s) => ({ ...s, exercises: [...s.exercises, { ...e, id: crypto.randomUUID() }] })),
      updateExercise: (id, patch) =>
        setState((s) => ({ ...s, exercises: s.exercises.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeExercise: (id) => setState((s) => ({ ...s, exercises: s.exercises.filter((x) => x.id !== id) })),
      resetAll: () => setState(EMPTY),
    };
  }, [state, logWeight]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
}

/** Workbench access: verified students and dietitians only. */
export const canUseWorkbench = (p: Profile | null) =>
  !!p && (p.role === "student" || p.role === "dietitian") && p.verification === "verified";
