import { describe, expect, it } from "vitest";
import { CATEGORIES_BY_CUISINE, CUISINES, FOODS, searchFoods } from "./foods";

describe("food database", () => {
  it("has unique ids", () => {
    expect(new Set(FOODS.map((f) => f.id)).size).toBe(FOODS.length);
  });

  it("puts every food in a known section of its cuisine", () => {
    for (const f of FOODS) expect(CATEGORIES_BY_CUISINE[f.cuisine]).toContain(f.category);
  });

  it("has at least one food in every section", () => {
    for (const c of CUISINES)
      for (const cat of CATEGORIES_BY_CUISINE[c.id])
        expect(FOODS.some((f) => f.cuisine === c.id && f.category === cat), `${c.id} / ${cat}`).toBe(true);
  });

  it("has sane nutrient values and portions", () => {
    for (const f of FOODS) {
      const macroKcal = f.carbs * 4 + f.protein * 4 + f.fat * 9;
      expect(f.portions.length, f.id).toBeGreaterThan(0);
      expect(f.portions.every((p) => p.grams > 0), f.id).toBe(true);
      // Energy should roughly match the macros (within 25% or 30 kcal).
      expect(Math.abs(macroKcal - f.kcal), f.id).toBeLessThanOrEqual(Math.max(30, f.kcal * 0.25));
    }
  });

  it("finds dishes by local or common names", () => {
    expect(searchFoods("garri").map((f) => f.id)).toContain("eba");
    expect(searchFoods("spag bol").map((f) => f.id)).toContain("bolognese");
    expect(searchFoods("shawama").map((f) => f.id)).toContain("shawarma");
  });
});
