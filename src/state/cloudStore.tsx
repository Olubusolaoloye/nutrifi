// Convex-backed store: same interface as the on-device store, so pages don't care which one runs.
import { useMutation, useQuery } from "convex/react";
import type { OptimisticLocalStore } from "convex/browser";
import type { FunctionReturnType } from "convex/server";
import { useMemo, type ReactNode } from "react";
import { DEFAULT_PLAN_PREFS } from "../lib/planner";
import { DEFAULT_REMINDERS } from "../lib/reminders";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  EMPTY,
  StoreContext,
  STORAGE_KEY,
  loadLocal,
  noteKey,
  type CalendarEvent,
  type DiaryEntry,
  type DiaryNote,
  type ExerciseEntry,
  type MealPlan,
  type PersistedState,
  type PlanPortions,
  type Profile,
  type Store,
} from "./store";

type Snapshot = NonNullable<FunctionReturnType<typeof api.me.snapshot>>;

function toState(s: Snapshot): PersistedState {
  const p = s.profile;
  const profile: Profile | null = p
    ? {
        name: p.name,
        role: p.role,
        verification: p.verification,
        sex: p.sex,
        birthDate: p.birthDate,
        heightCm: p.heightCm,
        activity: p.activity,
        goal: p.goal,
        conditions: p.conditions,
      }
    : null;
  const notes: Record<string, DiaryNote> = {};
  for (const n of s.notes) notes[noteKey(n.date, n.slot)] = { feeling: n.feeling, tags: n.tags, text: n.text, updatedAt: n.updatedAt };
  const plan: MealPlan = {};
  const planPortions: PlanPortions = {};
  for (const r of s.plan) {
    plan[r.date] = { ...(plan[r.date] ?? {}), [r.meal]: r.recipeId };
    if (r.portion && r.portion !== 1) planPortions[noteKey(r.date, r.meal)] = r.portion;
  }
  return {
    profile,
    diary: s.diary.map(
      (d): DiaryEntry => ({ id: d._id, date: d.date, meal: d.meal, foodId: d.foodId, grams: d.grams, portionLabel: d.portionLabel, loggedAt: d.loggedAt }),
    ),
    water: Object.fromEntries(s.water.map((w) => [w.date, w.ml])),
    weights: [...s.weights].sort((a, b) => a.date.localeCompare(b.date)).map((w) => ({ date: w.date, weightKg: w.weightKg })),
    notes,
    plan,
    planPortions,
    planPrefs: s.planPrefs ?? DEFAULT_PLAN_PREFS,
    reminders: s.reminders ? { ...DEFAULT_REMINDERS, ...s.reminders } : DEFAULT_REMINDERS,
    grocery: s.grocery ? { people: s.grocery.people, purchased: s.grocery.purchased, qtyOverride: s.grocery.qtyOverride } : EMPTY.grocery,
    events: s.events.map((e): CalendarEvent => ({ id: e._id, date: e.date, time: e.time, type: e.type, title: e.title, location: e.location, note: e.note })),
    exercises: s.exercises.map(
      (x): ExerciseEntry => ({ id: x._id, date: x.date, activityId: x.activityId, minutes: x.minutes, sets: x.sets, reps: x.reps, status: x.status }),
    ),
  };
}

/** Apply an optimistic change to the cached snapshot (instant UI while the server confirms). */
function patchSnapshot(store: OptimisticLocalStore, fn: (s: Snapshot) => Snapshot) {
  const current = store.getQuery(api.me.snapshot, {});
  if (current) store.setQuery(api.me.snapshot, {}, fn(current));
}

/** A temporary id for rows created optimistically; replaced by the real one moments later. */
const tempDiaryId = () => `temp_${crypto.randomUUID()}` as Id<"diary">;

export function ConvexStoreProvider({ children }: { children: ReactNode }) {
  const snapshot = useQuery(api.me.snapshot);

  const createProfile = useMutation(api.profile.create);
  const updateProfile = useMutation(api.profile.update);
  const addDiaryEntries = useMutation(api.data.addDiaryEntries).withOptimisticUpdate((store, { entries }) =>
    patchSnapshot(store, (s) => ({
      ...s,
      diary: [
        ...s.diary,
        ...entries.map((e) => ({ ...e, _id: tempDiaryId(), _creationTime: Date.now(), userId: s.profile!.userId, loggedAt: e.loggedAt ?? new Date().toISOString() })),
      ],
    })),
  );
  const removeDiaryEntry = useMutation(api.data.removeDiaryEntry).withOptimisticUpdate((store, { id }) =>
    patchSnapshot(store, (s) => ({ ...s, diary: s.diary.filter((d) => d._id !== id) })),
  );
  const addWater = useMutation(api.data.addWater).withOptimisticUpdate((store, { date, ml }) =>
    patchSnapshot(store, (s) => {
      const row = s.water.find((w) => w.date === date);
      const total = Math.max(0, (row?.ml ?? 0) + ml);
      return {
        ...s,
        water: row
          ? s.water.map((w) => (w.date === date ? { ...w, ml: total } : w))
          : [...s.water, { _id: `temp_${date}` as Id<"water">, _creationTime: Date.now(), userId: s.profile!.userId, date, ml: total }],
      };
    }),
  );
  const logWeight = useMutation(api.data.logWeight);
  const setNote = useMutation(api.data.setNote).withOptimisticUpdate((store, { date, slot, note }) =>
    patchSnapshot(store, (s) => {
      const others = s.notes.filter((n) => !(n.date === date && n.slot === slot));
      if (!note) return { ...s, notes: others };
      return {
        ...s,
        notes: [...others, { ...note, _id: `temp_${date}_${slot}` as Id<"notes">, _creationTime: Date.now(), userId: s.profile!.userId, date, slot, updatedAt: new Date().toISOString() }],
      };
    }),
  );
  const setPlanSlot = useMutation(api.data.setPlanSlot).withOptimisticUpdate((store, { date, meal, recipeId, portion }) =>
    patchSnapshot(store, (s) => {
      const others = s.plan.filter((p) => !(p.date === date && p.meal === meal));
      if (!recipeId) return { ...s, plan: others };
      return { ...s, plan: [...others, { _id: `temp_${date}_${meal}` as Id<"plan">, _creationTime: Date.now(), userId: s.profile!.userId, date, meal, recipeId, portion }] };
    }),
  );
  const replacePlan = useMutation(api.data.replacePlan).withOptimisticUpdate((store, { items }) =>
    patchSnapshot(store, (s) => {
      const keys = new Set(items.map((it) => `${it.date}|${it.meal}`));
      const kept = s.plan.filter((p) => !keys.has(`${p.date}|${p.meal}`));
      const added = items.map((it) => ({ _id: `temp_${it.date}_${it.meal}` as Id<"plan">, _creationTime: Date.now(), userId: s.profile!.userId, ...it }));
      return { ...s, plan: [...kept, ...added] };
    }),
  );
  const updatePlanPrefs = useMutation(api.settings.updatePlanPrefs).withOptimisticUpdate((store, { prefs }) =>
    patchSnapshot(store, (s) => ({ ...s, planPrefs: prefs })),
  );
  const updateReminders = useMutation(api.settings.updateReminders).withOptimisticUpdate((store, { reminders }) =>
    patchSnapshot(store, (s) => ({ ...s, reminders })),
  );
  const updateGrocery = useMutation(api.data.updateGrocery).withOptimisticUpdate((store, patch) =>
    patchSnapshot(store, (s) => {
      const base = s.grocery ?? { _id: "temp_grocery" as Id<"grocery">, _creationTime: Date.now(), userId: s.profile!.userId, ...EMPTY.grocery };
      return { ...s, grocery: { ...base, ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) } };
    }),
  );
  const addEvent = useMutation(api.data.addEvent);
  const removeEvent = useMutation(api.data.removeEvent);
  const addExercise = useMutation(api.data.addExercise);
  const updateExercise = useMutation(api.data.updateExercise);
  const removeExercise = useMutation(api.data.removeExercise);
  const deleteMyData = useMutation(api.data.deleteMyData);

  const store = useMemo<Store>(() => {
    const state = snapshot ? toState(snapshot) : EMPTY;
    const latest = state.weights.at(-1);
    const fire = (p: Promise<unknown>) => void p.catch((e) => console.error(e));
    return {
      ...state,
      mode: "cloud",
      ready: snapshot !== undefined,
      account: snapshot ? { email: snapshot.email, isAdmin: snapshot.isAdmin } : null,
      verificationInfo: snapshot?.verification ?? null,
      latestWeightKg: latest ? latest.weightKg : null,
      completeOnboarding: async (p, weightKg, credential) => {
        await createProfile({
          name: p.name, role: p.role, sex: p.sex, birthDate: p.birthDate, heightCm: p.heightCm,
          activity: p.activity, goal: p.goal, conditions: p.conditions, weightKg,
          credential: p.role !== "consumer" ? credential : undefined,
        });
      },
      updateProfile: (patch) => {
        // Role and verification are server-controlled; only personal details are editable.
        const { name, sex, birthDate, heightCm, activity, goal, conditions } = patch;
        fire(updateProfile({ name, sex, birthDate, heightCm, activity, goal, conditions }));
      },
      addDiaryEntries: (entries) => fire(addDiaryEntries({ entries: entries.map(({ date, meal, foodId, grams, portionLabel, loggedAt }) => ({ date, meal, foodId, grams, portionLabel, loggedAt })) })),
      removeDiaryEntry: (id) => { if (!id.startsWith("temp_")) fire(removeDiaryEntry({ id: id as Id<"diary"> })); },
      addWater: (date, ml) => fire(addWater({ date, ml })),
      logWeight: (date, weightKg) => fire(logWeight({ date, weightKg })),
      setNote: (date, slot, note) => fire(setNote({ date, slot, note: note && { feeling: note.feeling, tags: note.tags, text: note.text } })),
      setPlanSlot: (date, meal, recipeId, portion) => fire(setPlanSlot({ date, meal, recipeId, portion: recipeId && portion !== 1 ? portion : undefined })),
      replacePlan: (items) =>
        fire(replacePlan({ items: items.map(({ date, meal, recipeId, portion }) => ({ date, meal, recipeId, portion: portion !== 1 ? portion : undefined })) })),
      updatePlanPrefs: (prefs) => fire(updatePlanPrefs({ prefs })),
      updateReminders: (reminders) => fire(updateReminders({ reminders })),
      updateGrocery: (patch) => fire(updateGrocery(patch)),
      addEvent: ({ date, time, type, title, location, note }) => fire(addEvent({ date, time, type, title, location, note })),
      removeEvent: (id) => fire(removeEvent({ id: id as Id<"events"> })),
      addExercise: ({ date, activityId, minutes, sets, reps, status }) => fire(addExercise({ date, activityId, minutes, sets, reps, status })),
      updateExercise: (id, { minutes, sets, reps, status }) => fire(updateExercise({ id: id as Id<"exercises">, patch: { minutes, sets, reps, status } })),
      removeExercise: (id) => fire(removeExercise({ id: id as Id<"exercises"> })),
      resetAll: async (opts) => {
        await deleteMyData({ deleteAccount: opts?.deleteAccount });
      },
    };
  }, [snapshot, createProfile, updateProfile, addDiaryEntries, removeDiaryEntry, addWater, logWeight, setNote, setPlanSlot, replacePlan, updatePlanPrefs, updateReminders, updateGrocery, addEvent, removeEvent, addExercise, updateExercise, removeExercise, deleteMyData]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

/** Data saved on this device before accounts existed, ready for import. Null if there's nothing. */
export function localDataForImport() {
  try {
    if (!localStorage.getItem(STORAGE_KEY)) return null;
  } catch {
    return null;
  }
  const s = loadLocal();
  const count = s.diary.length + s.weights.length + Object.keys(s.notes).length + s.events.length + s.exercises.length;
  if (count === 0) return null;
  return {
    count,
    payload: {
      diary: s.diary.map(({ date, meal, foodId, grams, portionLabel, loggedAt }) => ({ date, meal, foodId, grams, portionLabel, loggedAt })),
      water: Object.entries(s.water).map(([date, ml]) => ({ date, ml })),
      weights: s.weights,
      notes: Object.entries(s.notes).map(([key, n]) => {
        const [date, slot] = key.split("|") as [string, "Breakfast" | "Lunch" | "Dinner" | "Snacks" | "Day"];
        return { date, slot, feeling: n.feeling, tags: n.tags, text: n.text, updatedAt: n.updatedAt };
      }),
      plan: Object.entries(s.plan).flatMap(([date, meals]) =>
        Object.entries(meals).filter(([, id]) => !!id).map(([meal, recipeId]) => {
          const portion = s.planPortions[noteKey(date, meal as "Breakfast" | "Lunch" | "Dinner" | "Snacks")];
          return { date, meal: meal as "Breakfast" | "Lunch" | "Dinner" | "Snacks", recipeId: recipeId!, ...(portion ? { portion } : {}) };
        }),
      ),
      events: s.events.map(({ date, time, type, title, location, note }) => ({ date, time, type, title, location, note })),
      exercises: s.exercises.map(({ date, activityId, minutes, sets, reps, status }) => ({ date, activityId, minutes, sets, reps, status })),
    },
  };
}

export function clearLocalData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
