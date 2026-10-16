import { describe, expect, it } from "vitest";
import { ARTICLES } from "./articles";
import { FOODS } from "./foods";
import { PHOTOS, photoFor, photoUrl } from "./photos";
import { RECIPES } from "./recipes";

describe("photos", () => {
  it("cover every food, recipe and article", () => {
    const missing = [
      ...FOODS.map((f) => f.id),
      ...RECIPES.map((r) => `recipe:${r.id}`),
      ...ARTICLES.map((a) => `article:${a.id}`),
    ].filter((k) => !photoFor(k));
    expect(missing).toEqual([]);
  });

  it("only reference known dishes", () => {
    const known = new Set([...FOODS.map((f) => f.id), ...RECIPES.map((r) => `recipe:${r.id}`), ...ARTICLES.map((a) => `article:${a.id}`)]);
    expect(Object.keys(PHOTOS).filter((k) => !known.has(k))).toEqual([]);
  });

  it("build resized Wikimedia URLs with the file name encoded", () => {
    expect(photoUrl({ file: "Falafel_&_Hummus_Wrap.jpg" }, 240)).toBe(
      "https://commons.wikimedia.org/wiki/Special:FilePath/Falafel_%26_Hummus_Wrap.jpg?width=240",
    );
  });
});
