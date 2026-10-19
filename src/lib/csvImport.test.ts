import { describe, expect, it } from "vitest";
import { parseCsv, toCsv } from "./csv";
import { diaryTemplate, parseAmount, parseDate, parseDiaryCsv, parseMeal, parsePlanCsv, parseTime, planTemplate } from "./csvImport";

const TODAY = "2026-10-19";
const ok = <T,>(r: T | { error: string }) => {
  if (typeof r === "object" && r && "error" in r) throw new Error(r.error);
  return r as T;
};

describe("parseCsv", () => {
  it("reads quoted cells, escaped quotes, CRLF and a BOM", () => {
    expect(parseCsv('﻿a,b\r\n"x, y","say ""hi"""\r\n\r\n')).toEqual([["a", "b"], ["x, y", 'say "hi"']]);
  });
  it("detects semicolon and tab separators", () => {
    expect(parseCsv("a;b\n1;2")).toEqual([["a", "b"], ["1", "2"]]);
    expect(parseCsv("a\tb\n1\t2")).toEqual([["a", "b"], ["1", "2"]]);
  });
  it("round-trips through toCsv", () => {
    const rows = [["name", "note"], ["Moi moi, with egg", 'a "b"']];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});

describe("field parsers", () => {
  it("reads ISO and day-first dates and rejects impossible ones", () => {
    expect(parseDate("2026-10-19")).toBe("2026-10-19");
    expect(parseDate("19/10/2026")).toBe("2026-10-19");
    expect(parseDate("5.3.26")).toBe("2026-03-05");
    expect(parseDate("19 Oct 2026")).toBe("2026-10-19");
    expect(parseDate("2026-02-30")).toBeNull();
    expect(parseDate("10/19/2026")).toBeNull();
    expect(parseDate("tomorrow")).toBeNull();
  });
  it("reads times, meals and amounts", () => {
    expect(parseTime("8:30 pm")).toBe("20:30");
    expect(parseTime("07.05")).toBe("07:05");
    expect(parseTime("25:00")).toBeNull();
    expect(parseMeal("snack")).toBe("Snacks");
    expect(parseMeal("Supper")).toBe("Dinner");
    expect(parseMeal("brunch")).toBeNull();
    expect(parseAmount("1½")).toBe(1.5);
    expect(parseAmount("3/4")).toBe(0.75);
    expect(parseAmount("lots")).toBeNull();
  });
});

describe("parseDiaryCsv", () => {
  it("matches foods by name, alias or id and works out the amount", () => {
    const r = ok(parseDiaryCsv(
      [
        "Date,Time,Meal,Food,Portion,Grams",
        "2026-10-19,08:00,Breakfast,akara,,120",
        "18/10/2026,,lunch,Jollof rice,1 plate,",
        "2026-10-18,,Dinner,eggs,,",
        "2026-10-17,,Snack,pounded-yam,2,",
      ].join("\n"),
      TODAY,
    ));
    expect(r.problems).toEqual([]);
    expect(r.items.map((e) => [e.line, e.date, e.meal, e.foodId, e.grams, e.portionLabel])).toEqual([
      [2, "2026-10-19", "Breakfast", "akara", 120, "120 g"],
      [3, "2026-10-18", "Lunch", "jollof", 300, "1 plate"],
      [4, "2026-10-18", "Dinner", "egg", 50, "1 egg"],
      [5, "2026-10-17", "Snacks", "pounded-yam", expect.any(Number), expect.stringMatching(/^2 × /)],
    ]);
    expect(r.items[0].loggedAt).toBe(new Date("2026-10-19T08:00:00").toISOString());
    expect(r.items[1].loggedAt).toBeUndefined();
  });

  it("accepts recipes and the diary's own week-table headings", () => {
    const r = ok(parseDiaryCsv("Date & time,Category,Menu,Amount\n2026-10-19 13:15,Lunch,Moi moi with egg,1 serving", TODAY));
    expect(r.problems).toEqual([]);
    expect(r.items[0]).toMatchObject({ foodId: "recipe:moimoi", grams: 100, portionLabel: "1 serving" });
    expect(r.items[0].loggedAt).toBe(new Date("2026-10-19T13:15:00").toISOString());
  });

  it("reports each bad row with its line and keeps the good ones", () => {
    const r = ok(parseDiaryCsv(
      [
        "date,meal,food,grams",
        "2026-10-19,Lunch,Jollof rice,",
        "2026-10-20,Lunch,Jollof rice,",
        "2026-10-19,Brunch,Jollof rice,",
        "2026-10-19,Lunch,Quinoa surprise,",
        "2026-10-19,Lunch,soup,",
        "2026-10-19,Lunch,Eba,9000",
        "not a date,Lunch,Eba,",
      ].join("\n"),
      TODAY,
    ));
    expect(r.items.map((e) => e.line)).toEqual([2]);
    expect(r.problems.map((p) => p.line)).toEqual([3, 4, 5, 6, 7, 8]);
    expect(r.problems[0].message).toMatch(/future/);
    expect(r.problems[3].message).toMatch(/more than one food/);
  });

  it("explains a missing header or an empty file", () => {
    expect(parseDiaryCsv("", TODAY)).toEqual({ error: "The file is empty." });
    expect(parseDiaryCsv("when,what\n2026-10-19,Eba", TODAY)).toMatchObject({ error: expect.stringMatching(/Missing: date, meal, food/) });
  });

  it("reads its own template", () => {
    const r = ok(parseDiaryCsv(diaryTemplate(TODAY), TODAY));
    expect(r.problems).toEqual([]);
    expect(r.items).toHaveLength(4);
  });
});

describe("parsePlanCsv", () => {
  it("reads recipes and servings, later rows winning for the same slot", () => {
    const r = ok(parsePlanCsv(
      [
        "date,meal,recipe,servings",
        "2026-10-20,Breakfast,Akara with pap,1½",
        "2026-10-20,Lunch,jollof-chicken,",
        "2026-10-20,Breakfast,Moi moi with egg,0.6",
        "2026-10-21,Dinner,Fried plantain (dodo),1",
        "2026-10-21,Dinner,Spaghetti bolognese,9",
      ].join("\n"),
    ));
    expect(r.items).toEqual([
      { line: 3, date: "2026-10-20", meal: "Lunch", recipeId: "jollof-chicken", portion: 1 },
      { line: 4, date: "2026-10-20", meal: "Breakfast", recipeId: "moimoi", portion: 0.5 },
    ]);
    expect(r.problems.map((p) => p.line)).toEqual([2, 5, 6]);
    expect(r.problems[0].message).toMatch(/Replaced by line 4/);
    expect(r.problems[1].message).toMatch(/Healthy menu/);
  });

  it("reads its own template", () => {
    const r = ok(parsePlanCsv(planTemplate(["2026-10-19", "2026-10-20"])));
    expect(r.problems).toEqual([]);
    expect(r.items.length).toBeGreaterThanOrEqual(6);
  });
});
