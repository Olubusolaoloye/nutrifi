// Calorie distribution across macronutrients and meals.

export interface MacroSplit {
  carbsPercent: number;
  proteinPercent: number;
  fatPercent: number;
}

export type Macro = "carbs" | "protein" | "fat";

export const KCAL_PER_GRAM: Record<Macro, number> = { carbs: 4, protein: 4, fat: 9 };

/** Acceptable Macronutrient Distribution Ranges for adults (IOM 2005), % of energy. */
export const AMDR: Record<Macro, { min: number; max: number }> = {
  carbs: { min: 45, max: 65 },
  protein: { min: 10, max: 35 },
  fat: { min: 20, max: 35 },
};

export const MACRO_PRESETS: Record<string, { label: string; split: MacroSplit }> = {
  standard: { label: "Standard", split: { carbsPercent: 55, proteinPercent: 15, fatPercent: 30 } },
  diabetic: { label: "Diabetic-friendly", split: { carbsPercent: 45, proteinPercent: 20, fatPercent: 35 } },
  high_protein: { label: "High-protein", split: { carbsPercent: 45, proteinPercent: 30, fatPercent: 25 } },
};

export interface MacroResult {
  macro: Macro;
  percent: number;
  kcal: number;
  grams: number;
  withinAmdr: boolean;
}

export function distributeMacros(totalKcal: number, split: MacroSplit): MacroResult[] {
  const sum = split.carbsPercent + split.proteinPercent + split.fatPercent;
  if (Math.abs(sum - 100) > 0.01) throw new RangeError(`Macro split must total 100%, got ${sum}%`);
  const entries: Array<[Macro, number]> = [
    ["carbs", split.carbsPercent],
    ["protein", split.proteinPercent],
    ["fat", split.fatPercent],
  ];
  return entries.map(([macro, percent]) => {
    const kcal = (totalKcal * percent) / 100;
    return {
      macro,
      percent,
      kcal,
      grams: kcal / KCAL_PER_GRAM[macro],
      withinAmdr: percent >= AMDR[macro].min && percent <= AMDR[macro].max,
    };
  });
}

export const DEFAULT_MEAL_SHARES: Record<string, number> = {
  Breakfast: 25,
  Lunch: 35,
  Dinner: 30,
  Snacks: 10,
};

export function distributeMeals(totalKcal: number, shares: Record<string, number> = DEFAULT_MEAL_SHARES) {
  const sum = Object.values(shares).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 100) > 0.01) throw new RangeError(`Meal shares must total 100%, got ${sum}%`);
  return Object.entries(shares).map(([meal, percent]) => ({ meal, percent, kcal: (totalKcal * percent) / 100 }));
}
