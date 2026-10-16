// Total energy expenditure and the consumer daily target ("hybrid model").
import { bmiCategory, calculateBmi } from "./bmi";
import { calculateBmr, type BmrEquation } from "./bmr";
import type { Anthropometrics, Sex } from "./types";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "vigorous";

/** Physical activity level multipliers (FAO/WHO/UNU 2001, mid-range values). */
export const PAL: Record<ActivityLevel, { value: number; label: string; consumerLabel: string }> = {
  sedentary: { value: 1.4, label: "Sedentary (PAL 1.40)", consumerLabel: "Mostly sitting" },
  light: { value: 1.55, label: "Lightly / moderately active (PAL 1.55)", consumerLabel: "On my feet a lot" },
  moderate: { value: 1.75, label: "Active (PAL 1.75)", consumerLabel: "Active most of the day" },
  vigorous: { value: 2.0, label: "Vigorous (PAL 2.00)", consumerLabel: "Very active / manual work" },
};

export type PhysiologicalState =
  | "none"
  | "pregnant_t1"
  | "pregnant_t2"
  | "pregnant_t3"
  | "lactating_0_6m"
  | "lactating_7_12m";

/** Extra kcal/day. Source: IOM Dietary Reference Intakes for Energy (2005). Pro-only. */
export const PHYSIOLOGICAL_EXTRA_KCAL: Record<PhysiologicalState, number> = {
  none: 0,
  pregnant_t1: 0,
  pregnant_t2: 340,
  pregnant_t3: 452,
  lactating_0_6m: 330,
  lactating_7_12m: 400,
};

export interface EnergyInput {
  equation: BmrEquation;
  pal: number;
  physiologicalState?: PhysiologicalState;
  /** Clinical stress/injury factor, e.g. 1.2. Defaults to 1. */
  stressFactor?: number;
}

export interface EnergyBreakdown {
  bmr: number;
  pal: number;
  stressFactor: number;
  extraKcal: number;
  tee: number;
}

/** TEE = BMR × PAL × stress factor + physiological extra. Steps are returned for "show working". */
export function calculateEnergy(a: Anthropometrics, input: EnergyInput): EnergyBreakdown {
  if (!(input.pal >= 1 && input.pal <= 2.5)) throw new RangeError("PAL must be between 1.0 and 2.5");
  const stressFactor = input.stressFactor ?? 1;
  if (!(stressFactor >= 1 && stressFactor <= 2)) throw new RangeError("Stress factor must be between 1.0 and 2.0");
  const bmr = calculateBmr(input.equation, a);
  const extraKcal = PHYSIOLOGICAL_EXTRA_KCAL[input.physiologicalState ?? "none"];
  return { bmr, pal: input.pal, stressFactor, extraKcal, tee: bmr * input.pal * stressFactor + extraKcal };
}

export type Goal = "lose" | "maintain" | "gain" | "eat_healthier";

export type Condition =
  | "diabetes"
  | "hypertension"
  | "kidney_disease"
  | "pregnant"
  | "breastfeeding";

export const CONDITION_LABEL: Record<Condition, string> = {
  diabetes: "Diabetes",
  hypertension: "High blood pressure",
  kidney_disease: "Kidney disease",
  pregnant: "Pregnant",
  breastfeeding: "Breastfeeding",
};

export interface ConsumerProfile extends Anthropometrics {
  activity: ActivityLevel;
  goal: Goal;
  conditions: Condition[];
}

export type ConsumerTarget =
  | {
      kind: "target";
      kcal: number;
      maintenanceKcal: number;
      /** Set when the goal was adjusted for safety, e.g. weight loss while underweight. */
      note?: string;
    }
  | { kind: "needs_dietitian"; reason: "condition" | "under_18" };

const WEIGHT_LOSS_DEFICIT = 500;
const WEIGHT_GAIN_SURPLUS = 300;
const MIN_TARGET_KCAL: Record<Sex, number> = { female: 1200, male: 1500 };

const roundTo50 = (kcal: number) => Math.round(kcal / 50) * 50;

/**
 * The single, friendly daily target consumers see. Always Mifflin-St Jeor.
 * People with a medical condition, pregnancy or under 18 get no automatic target —
 * a dietitian sets it instead.
 */
export function consumerDailyTarget(p: ConsumerProfile): ConsumerTarget {
  if (p.ageYears < 18) return { kind: "needs_dietitian", reason: "under_18" };
  if (p.conditions.length > 0) return { kind: "needs_dietitian", reason: "condition" };

  const maintenance = calculateEnergy(p, { equation: "mifflin", pal: PAL[p.activity].value }).tee;
  const underweight = bmiCategory(calculateBmi(p.weightKg, p.heightCm)) === "underweight";

  let kcal = maintenance;
  let note: string | undefined;
  if (p.goal === "lose") {
    if (underweight) {
      note = "Your weight is already below the healthy range, so we've set a target to maintain it.";
    } else {
      kcal = Math.max(maintenance - WEIGHT_LOSS_DEFICIT, MIN_TARGET_KCAL[p.sex]);
    }
  } else if (p.goal === "gain") {
    kcal = maintenance + WEIGHT_GAIN_SURPLUS;
  }

  return { kind: "target", kcal: roundTo50(kcal), maintenanceKcal: roundTo50(maintenance), note };
}
