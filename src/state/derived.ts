import { foodById, nutrientsFor } from "../data/foods";
import {
  calculateBmi,
  consumerDailyTarget,
  dailyWaterTargetMl,
  type ConsumerTarget,
} from "../lib/nutrition";
import { ageFromBirthDate, type DiaryEntry, type Profile } from "./store";

export function dailyTotals(entries: DiaryEntry[]) {
  return entries.reduce(
    (t, e) => {
      const food = foodById(e.foodId);
      if (!food) return t;
      const n = nutrientsFor(food, e.grams);
      return { kcal: t.kcal + n.kcal, carbs: t.carbs + n.carbs, protein: t.protein + n.protein, fat: t.fat + n.fat };
    },
    { kcal: 0, carbs: 0, protein: 0, fat: 0 },
  );
}

export interface BodySummary {
  ageYears: number;
  bmi: number;
  target: ConsumerTarget;
  waterTargetMl: number;
}

/** A dietitian-set target (on an active programme) replaces the automatic one, even for people with conditions. */
export function bodySummary(profile: Profile, weightKg: number, dietitianTarget?: { kcal: number } | null): BodySummary {
  const ageYears = ageFromBirthDate(profile.birthDate);
  return {
    ageYears,
    bmi: calculateBmi(weightKg, profile.heightCm),
    target: dietitianTarget
      ? { kind: "target", kcal: dietitianTarget.kcal, maintenanceKcal: dietitianTarget.kcal, source: "dietitian", note: "Set by your dietitian." }
      : consumerDailyTarget({
      sex: profile.sex,
      ageYears,
      weightKg,
      heightCm: profile.heightCm,
      activity: profile.activity,
      goal: profile.goal,
      conditions: profile.conditions,
    }),
    waterTargetMl: dailyWaterTargetMl(weightKg),
  };
}

export const fmt = (n: number, digits = 0) =>
  n.toLocaleString("en-NG", { maximumFractionDigits: digits, minimumFractionDigits: digits });
