import { describe, expect, it } from "vitest";
import { RECIPES, costPerServing, recipeAllergens, recipeById } from "../data/recipes";
import { weekDates } from "../state/store";
import { DEFAULT_PLAN_PREFS, fitPortion, mealTargets, personalWeekPlan, portionLabel, swapOptions } from "./planner";

const WEEK = weekDates("2026-10-19");

describe("portions", () => {
  it("rounds to quarter servings between ½ and 2", () => {
    const jollof = recipeById("jollof-chicken")!; // 560 kcal
    expect(fitPortion(jollof, 560)).toBe(1);
    expect(fitPortion(jollof, 840)).toBe(1.5);
    expect(fitPortion(jollof, 5000)).toBe(2);
    expect(fitPortion(jollof, 50)).toBe(0.5);
  });

  it("labels portions in plain words", () => {
    expect(portionLabel(1)).toBe("1 serving");
    expect(portionLabel(1.5)).toBe("1½ servings");
    expect(portionLabel(0.75)).toBe("¾ servings");
    expect(portionLabel(2)).toBe("2 servings");
  });

  it("splits the daily target across meals", () => {
    expect(mealTargets(2000)).toEqual({ Breakfast: 500, Lunch: 700, Dinner: 600, Snacks: 200 });
  });
});

describe("personal week plan", () => {
  it("fills every slot and lands near the daily target", () => {
    for (const kcal of [1400, 2000, 2600]) {
      const plan = personalWeekPlan(WEEK, kcal, DEFAULT_PLAN_PREFS);
      expect(plan.items).toHaveLength(28);
      expect(plan.unfilled).toEqual([]);
      expect(Math.abs(plan.avgKcal - kcal) / kcal, `${kcal} kcal`).toBeLessThan(0.12);
    }
  });

  it("prefers the chosen cuisines and avoids the same dish on consecutive days", () => {
    const plan = personalWeekPlan(WEEK, 2000, DEFAULT_PLAN_PREFS);
    expect(plan.items.every((it) => recipeById(it.recipeId)!.cuisine === "Nigerian")).toBe(true);
    for (const meal of ["Breakfast", "Lunch", "Dinner"] as const) {
      const seq = plan.items.filter((it) => it.meal === meal).map((it) => it.recipeId);
      for (let i = 1; i < seq.length; i++) expect(seq[i], `${meal} day ${i}`).not.toBe(seq[i - 1]);
    }
  });

  it("never includes avoided allergens or meat for vegetarians", () => {
    const plan = personalWeekPlan(WEEK, 2000, { ...DEFAULT_PLAN_PREFS, cuisines: ["Nigerian", "Continental", "International"], diet: "vegetarian", avoid: ["peanut", "egg"] });
    for (const it of plan.items) {
      const r = recipeById(it.recipeId)!;
      expect(recipeAllergens(r)).not.toContain("peanut");
      expect(recipeAllergens(r)).not.toContain("egg");
      expect(r.ingredients.some((i) => ["chicken", "beef", "fish", "salmon", "crayfish"].includes(i.id)), r.id).toBe(false);
    }
  });

  it("reports slots it can't fill instead of breaking the rules", () => {
    // Vegan-ish and no groundnuts/dairy leaves only fruit salad and hummus for snacks, but no breakfast without eggs/dairy/beans-with-crayfish…
    const plan = personalWeekPlan(WEEK, 2000, { ...DEFAULT_PLAN_PREFS, diet: "vegetarian", avoid: ["egg", "dairy", "gluten", "peanut"] });
    const allowed = new Set(plan.items.map((i) => i.recipeId));
    for (const id of allowed) expect(recipeAllergens(recipeById(id)!)).toEqual([]);
    expect(plan.items.length + plan.unfilled.length).toBe(28);
  });

  it("keeps cheaper dishes when a budget is set", () => {
    const free = personalWeekPlan(WEEK, 2000, DEFAULT_PLAN_PREFS);
    const tight = personalWeekPlan(WEEK, 2000, { ...DEFAULT_PLAN_PREFS, budgetPerDay: 2500 });
    expect(tight.avgCost).toBeLessThanOrEqual(free.avgCost);
  });
});

describe("swap options", () => {
  it("offers same-slot dishes with similar calories, best first", () => {
    const opts = swapOptions("Breakfast", { recipeId: "moimoi", portion: 1.5 }, DEFAULT_PLAN_PREFS);
    expect(opts.length).toBeGreaterThan(1);
    const target = 290 * 1.5;
    for (const o of opts) {
      expect(o.recipe.id).not.toBe("moimoi");
      expect(o.recipe.meal).toBe("Breakfast");
      expect(Math.abs(o.kcal - target)).toBeLessThanOrEqual(target * 0.25);
    }
    const gaps = opts.map((o) => Math.abs(o.deltaKcal));
    expect(gaps).toEqual([...gaps].sort((a, b) => a - b));
  });

  it("lets lunch and dinner mains swap with each other and labels why", () => {
    const opts = swapOptions("Dinner", { recipeId: "egusi-eba", portion: 1 }, DEFAULT_PLAN_PREFS);
    expect(opts.some((o) => o.recipe.meal === "Lunch")).toBe(true);
    const cheaper = opts.find((o) => o.reasons.includes("Cheaper"));
    if (cheaper) expect(cheaper.cost).toBeLessThan(costPerServing(recipeById("egusi-eba")!) * 0.9);
  });

  it("respects allergies", () => {
    const opts = swapOptions("Breakfast", { recipeId: "akara-pap", portion: 1 }, { ...DEFAULT_PLAN_PREFS, cuisines: ["Nigerian", "Continental", "International"], avoid: ["egg"] });
    for (const o of opts) expect(recipeAllergens(o.recipe)).not.toContain("egg");
  });

  it("returns nothing for an unknown dish", () => {
    expect(swapOptions("Lunch", { recipeId: "nope", portion: 1 }, DEFAULT_PLAN_PREFS)).toEqual([]);
  });
});

describe("recipe data used by the planner", () => {
  it("every recipe has a positive cost", () => {
    for (const r of RECIPES) expect(costPerServing(r), r.id).toBeGreaterThan(0);
  });
});
