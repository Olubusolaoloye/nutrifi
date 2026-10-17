// SAMPLE data for the no-account preview of programmes and the dietitian tools.
// These are fictional people, always labelled "Sample" in the app. Real listings come from verified dietitians.
import { shiftDate } from "../lib/dates";
import type { ClientDetail, DietitianCard, Offering } from "../lib/interventions";

export const SAMPLE_DIETITIANS: DietitianCard[] = [
  {
    id: "sample-d1", name: "Funke A. (sample)", yearsExperience: 9, clientsHelped: 140, languages: ["English", "Yoruba"],
    bio: "Registered dietitian in Lagos focused on diabetes and weight management with everyday Nigerian food.",
  },
  {
    id: "sample-d2", name: "Chidi O. (sample)", yearsExperience: 6, clientsHelped: 85, languages: ["English", "Igbo", "Pidgin"],
    bio: "Clinical dietitian in Enugu. Kidney health, blood pressure and sports nutrition.",
  },
  {
    id: "sample-d3", name: "Amina B. (sample)", yearsExperience: 11, clientsHelped: 210, languages: ["English", "Hausa"],
    bio: "Maternal and child nutrition in Kano and Abuja. Pregnancy, breastfeeding and child growth.",
  },
];

const OFFERS: Record<string, Array<[string, number]>> = {
  "sample-d1": [["consult", 10000], ["diabetes", 40000], ["weight-loss", 30000], ["pcos", 35000]],
  "sample-d2": [["consult", 8000], ["hypertension", 28000], ["kidney", 45000], ["sports", 30000], ["weight-loss", 25000]],
  "sample-d3": [["consult", 7500], ["pregnancy", 30000], ["child-growth", 15000], ["pcos", 32000]],
};

export const SAMPLE_OFFERINGS: Offering[] = SAMPLE_DIETITIANS.flatMap((d) =>
  OFFERS[d.id].map(([programmeId, priceNaira]) => ({ id: `${d.id}:${programmeId}`, programmeId, priceNaira, dietitian: d })),
);

const MEAL_PATTERNS = [
  [["Breakfast", "bread", 75, "3 slices"], ["Breakfast", "tea", 250, "1 mug"], ["Lunch", "jollof", 280, "4 spoons"], ["Lunch", "chicken", 100, "1 piece"], ["Dinner", "eba", 250, "Medium wrap"], ["Dinner", "egusi", 200, "1 ladle"]],
  [["Breakfast", "akara", 75, "3 balls"], ["Breakfast", "pap", 300, "1 bowl"], ["Lunch", "white-rice", 210, "3 spoons"], ["Lunch", "fish", 100, "1 piece"], ["Dinner", "beans", 250, "1 plate"], ["Dinner", "dodo", 100, "6 slices"]],
  [["Breakfast", "moimoi", 150, "1 wrap"], ["Lunch", "okra", 200, "1 ladle"], ["Lunch", "amala", 250, "Medium wrap"], ["Snacks", "groundnut", 30, "Handful"], ["Dinner", "jollof", 210, "3 spoons"]],
] as const;

/** Fictional clients with two weeks of logs, built relative to `today`. */
export function sampleClients(today: string): ClientDetail[] {
  const make = (
    id: string, name: string, programmeId: string, startDaysAgo: number, skip: (daysAgo: number) => boolean,
    person: Pick<ClientDetail, "sex" | "birthDate" | "heightCm" | "activity" | "goal" | "conditions">,
    weights: number[], intake: Partial<ClientDetail["intake"]>, unreadText?: string,
  ): ClientDetail => {
    const diary: ClientDetail["diary"] = [];
    const water: Record<string, number> = {};
    for (let ago = 13; ago >= 0; ago--) {
      if (skip(ago)) continue;
      const date = shiftDate(today, -ago);
      for (const [meal, foodId, grams, portionLabel] of MEAL_PATTERNS[ago % MEAL_PATTERNS.length]) diary.push({ date, meal, foodId, grams, portionLabel });
      water[date] = 1250 + (ago % 4) * 250;
    }
    const startDate = shiftDate(today, -startDaysAgo);
    const ws = weights.map((w, i) => ({ date: shiftDate(today, -7 * (weights.length - 1 - i)), weightKg: w }));
    const messages = unreadText
      ? [{ id: `${id}-m1`, fromMe: false, senderName: name, text: unreadText, sentAt: new Date(Date.now() - 3 * 3600_000).toISOString() }]
      : [];
    const dates = diary.map((d) => d.date);
    const last = dates.length ? dates[dates.length - 1] : null;
    const logged7 = new Set(dates.filter((d) => d >= shiftDate(today, -6))).size;
    return {
      enrolmentId: id, name, programmeId, status: "active", startDate, sample: true,
      daysLogged7: logged7, lastLogDate: last, latestWeightKg: ws.at(-1)?.weightKg ?? null,
      weightChangeKg: ws.length > 1 ? Math.round((ws.at(-1)!.weightKg - ws[0].weightKg) * 10) / 10 : null,
      unread: messages.length,
      ...person,
      intake: { goals: "", conditions: person.conditions, medications: "", typicalDay: "", allergies: "", consent: true, ...intake },
      weights: ws, diary, water,
      notes: last ? [{ date: last, slot: "Day", feeling: 3, tags: ["Cravings"], text: "Long day at work, ate late." }] : [],
      adjuncts: [], checkIns: [], messages,
    };
  };
  return [
    make("sample-c1", "Ngozi E. (sample)", "diabetes", 16, (a) => a === 2 || a === 9,
      { sex: "female", birthDate: "1978-04-02", heightCm: 162, activity: "light", goal: "lose", conditions: ["diabetes"] },
      [84.2, 83.6, 83.1], { goals: "Bring my sugar down and lose a little weight", medications: "Metformin 500 mg twice daily", typicalDay: "Bread and tea in the morning, rice or swallow at lunch, light dinner", allergies: "None" },
      "Good morning! Can I still eat agege bread on the plan?"),
    make("sample-c2", "Tunde A. (sample)", "weight-loss", 40, (a) => a % 3 === 0,
      { sex: "male", birthDate: "1990-09-12", heightCm: 178, activity: "sedentary", goal: "lose", conditions: [] },
      [101.5, 100.2, 99.0, 98.6, 97.9, 97.4], { goals: "Lose 10 kg before my wedding in March", typicalDay: "Skips breakfast, buys lunch near the office, big dinner", allergies: "Groundnuts" }),
    make("sample-c3", "Halima S. (sample)", "pregnancy", 5, (a) => a < 4,
      { sex: "female", birthDate: "1997-01-20", heightCm: 158, activity: "light", goal: "eat_healthier", conditions: ["pregnant"] },
      [62.0], { goals: "Eat well for my baby, I'm 14 weeks", medications: "Antenatal vitamins from the clinic", typicalDay: "Pap and akara, rice at lunch, tuwo for dinner", allergies: "None" }),
  ];
}

