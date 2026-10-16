import { describe, expect, it } from "vitest";
import {
  bmiCategory,
  calculateBmi,
  calculateBmr,
  calculateEnergy,
  compareBmr,
  consumerDailyTarget,
  dailyWaterTargetMl,
  distributeMacros,
  distributeMeals,
  type Anthropometrics,
  type ConsumerProfile,
} from ".";

// Reference case from the design brief.
const adaeze: Anthropometrics = { sex: "female", ageYears: 30, weightKg: 70, heightCm: 165 };
const man: Anthropometrics = { sex: "male", ageYears: 30, weightKg: 80, heightCm: 180 };

describe("BMI", () => {
  it("calculates kg/m²", () => {
    expect(calculateBmi(70, 165)).toBeCloseTo(25.71, 2);
  });

  it.each([
    [18.4, "underweight"],
    [18.5, "normal"],
    [24.99, "normal"],
    [25, "overweight"],
    [30, "obese_1"],
    [35, "obese_2"],
    [40, "obese_3"],
  ])("BMI %d is %s", (bmi, category) => {
    expect(bmiCategory(bmi)).toBe(category);
  });

  it("rejects impossible inputs", () => {
    expect(() => calculateBmi(0, 165)).toThrow(RangeError);
    expect(() => calculateBmi(70, Number.NaN)).toThrow(RangeError);
  });
});

describe("BMR equations", () => {
  it("Mifflin-St Jeor", () => {
    expect(calculateBmr("mifflin", adaeze)).toBeCloseTo(1420.25, 2);
    expect(calculateBmr("mifflin", man)).toBeCloseTo(1780, 2);
  });

  it("Harris-Benedict (revised)", () => {
    expect(calculateBmr("harris_benedict", adaeze)).toBeCloseTo(1476.15, 1);
    expect(calculateBmr("harris_benedict", man)).toBeCloseTo(1853.63, 1);
  });

  it("Schofield picks the right age band", () => {
    expect(calculateBmr("schofield", adaeze)).toBeCloseTo(1438, 5); // F 30–60: 8.7W + 829
    expect(calculateBmr("schofield", { ...adaeze, ageYears: 25 })).toBeCloseTo(1525, 5); // F 18–30: 14.7W + 496
    expect(calculateBmr("schofield", man)).toBeCloseTo(1807, 5); // M 30–60: 11.6W + 879
    expect(calculateBmr("schofield", { ...man, ageYears: 65 })).toBeCloseTo(1567, 5); // M 60+: 13.5W + 487
  });

  it("Katch-McArdle needs body fat", () => {
    expect(() => calculateBmr("katch_mcardle", adaeze)).toThrow(RangeError);
    expect(calculateBmr("katch_mcardle", { ...adaeze, bodyFatPercent: 30 })).toBeCloseTo(370 + 21.6 * 49, 5);
  });

  it("compares only the equations the inputs allow", () => {
    expect(compareBmr(adaeze).map((r) => r.equation)).toEqual(["mifflin", "harris_benedict", "schofield"]);
    expect(compareBmr({ ...adaeze, bodyFatPercent: 30 })).toHaveLength(4);
  });
});

describe("Energy requirement", () => {
  it("TEE = BMR × PAL", () => {
    const e = calculateEnergy(adaeze, { equation: "mifflin", pal: 1.55 });
    expect(e.tee).toBeCloseTo(2201.39, 1);
  });

  it("adds stress factor and pregnancy extra", () => {
    const e = calculateEnergy(adaeze, {
      equation: "mifflin",
      pal: 1.55,
      stressFactor: 1.2,
      physiologicalState: "pregnant_t3",
    });
    expect(e.tee).toBeCloseTo(1420.25 * 1.55 * 1.2 + 452, 5);
  });

  it("rejects out-of-range PAL", () => {
    expect(() => calculateEnergy(adaeze, { equation: "mifflin", pal: 3 })).toThrow(RangeError);
  });
});

describe("Consumer daily target (hybrid model)", () => {
  const base: ConsumerProfile = { ...adaeze, activity: "light", goal: "lose", conditions: [] };

  it("gives Adaeze about 1,700 kcal to lose weight", () => {
    expect(consumerDailyTarget(base)).toEqual({ kind: "target", kcal: 1700, maintenanceKcal: 2200, note: undefined });
  });

  it("maintain and gain", () => {
    expect(consumerDailyTarget({ ...base, goal: "maintain" })).toMatchObject({ kcal: 2200 });
    expect(consumerDailyTarget({ ...base, goal: "gain" })).toMatchObject({ kcal: 2500 });
  });

  it("never goes below the safe floor", () => {
    const small: ConsumerProfile = { ...base, weightKg: 52, heightCm: 150, ageYears: 60, activity: "sedentary" };
    expect(consumerDailyTarget(small)).toMatchObject({ kcal: 1200 });
  });

  it("does not set a weight-loss target for someone underweight", () => {
    const t = consumerDailyTarget({ ...base, weightKg: 48 });
    expect(t.kind).toBe("target");
    if (t.kind === "target") {
      expect(t.kcal).toBe(t.maintenanceKcal);
      expect(t.note).toBeDefined();
    }
  });

  it("sends anyone with a condition to a dietitian", () => {
    expect(consumerDailyTarget({ ...base, conditions: ["diabetes"] })).toEqual({
      kind: "needs_dietitian",
      reason: "condition",
    });
  });

  it("sends under-18s to a dietitian", () => {
    expect(consumerDailyTarget({ ...base, ageYears: 16 })).toEqual({ kind: "needs_dietitian", reason: "under_18" });
  });
});

describe("Calorie distribution", () => {
  it("splits 2,200 kcal at 55/15/30", () => {
    const [carbs, protein, fat] = distributeMacros(2200, { carbsPercent: 55, proteinPercent: 15, fatPercent: 30 });
    expect(carbs.grams).toBeCloseTo(302.5, 5);
    expect(protein.grams).toBeCloseTo(82.5, 5);
    expect(fat.grams).toBeCloseTo(73.33, 2);
    expect([carbs, protein, fat].every((m) => m.withinAmdr)).toBe(true);
  });

  it("flags splits outside AMDR and rejects totals ≠ 100%", () => {
    const [carbs] = distributeMacros(2000, { carbsPercent: 70, proteinPercent: 10, fatPercent: 20 });
    expect(carbs.withinAmdr).toBe(false);
    expect(() => distributeMacros(2000, { carbsPercent: 50, proteinPercent: 20, fatPercent: 20 })).toThrow(RangeError);
  });

  it("splits across meals", () => {
    expect(distributeMeals(2000).map((m) => m.kcal)).toEqual([500, 700, 600, 200]);
  });
});

describe("Water", () => {
  it("35 ml/kg rounded to 50 ml", () => {
    expect(dailyWaterTargetMl(70)).toBe(2450);
  });
});
