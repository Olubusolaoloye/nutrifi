// Basal metabolic rate (kcal/day) equations offered in the Professional Workbench.
import { assertPositive } from "./bmi";
import type { Anthropometrics, Sex } from "./types";

export type BmrEquation = "mifflin" | "harris_benedict" | "schofield" | "katch_mcardle";

export const BMR_EQUATION_INFO: Record<BmrEquation, { name: string; source: string }> = {
  mifflin: {
    name: "Mifflin-St Jeor",
    source: "Mifflin MD et al., Am J Clin Nutr 1990;51:241–7",
  },
  harris_benedict: {
    name: "Harris-Benedict (revised)",
    source: "Roza AM, Shizgal HM, Am J Clin Nutr 1984;40:168–82",
  },
  schofield: {
    name: "Schofield (FAO/WHO/UNU)",
    source: "Schofield WN, Hum Nutr Clin Nutr 1985;39C:5–41; FAO/WHO/UNU TRS 724 (1985)",
  },
  katch_mcardle: {
    name: "Katch-McArdle",
    source: "Uses lean body mass: 370 + 21.6 × LBM (kg)",
  },
};

export function mifflinStJeor({ sex, ageYears, weightKg, heightCm }: Anthropometrics): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return sex === "male" ? base + 5 : base - 161;
}

export function harrisBenedictRevised({ sex, ageYears, weightKg, heightCm }: Anthropometrics): number {
  return sex === "male"
    ? 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * ageYears
    : 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * ageYears;
}

/** [minAgeInclusive, slope, intercept] in kcal/day, by sex. Weight-only equations. */
const SCHOFIELD: Record<Sex, Array<[number, number, number]>> = {
  male: [
    [0, 60.9, -54],
    [3, 22.7, 495],
    [10, 17.5, 651],
    [18, 15.3, 679],
    [30, 11.6, 879],
    [60, 13.5, 487],
  ],
  female: [
    [0, 61.0, -51],
    [3, 22.5, 499],
    [10, 12.2, 746],
    [18, 14.7, 496],
    [30, 8.7, 829],
    [60, 10.5, 596],
  ],
};

export function schofield({ sex, ageYears, weightKg }: Anthropometrics): number {
  const bands = SCHOFIELD[sex];
  let band = bands[0];
  for (const b of bands) if (ageYears >= b[0]) band = b;
  const [, slope, intercept] = band;
  return slope * weightKg + intercept;
}

export function katchMcArdle({ weightKg, bodyFatPercent }: Anthropometrics): number {
  if (bodyFatPercent === undefined || bodyFatPercent <= 0 || bodyFatPercent >= 70) {
    throw new RangeError("Katch-McArdle needs a body fat % between 0 and 70");
  }
  const leanMassKg = weightKg * (1 - bodyFatPercent / 100);
  return 370 + 21.6 * leanMassKg;
}

const IMPLEMENTATIONS: Record<BmrEquation, (a: Anthropometrics) => number> = {
  mifflin: mifflinStJeor,
  harris_benedict: harrisBenedictRevised,
  schofield,
  katch_mcardle: katchMcArdle,
};

export function calculateBmr(equation: BmrEquation, a: Anthropometrics): number {
  assertPositive(a.weightKg, "weightKg");
  assertPositive(a.heightCm, "heightCm");
  if (!Number.isFinite(a.ageYears) || a.ageYears < 0) {
    throw new RangeError(`ageYears must be 0 or more, got ${a.ageYears}`);
  }
  return IMPLEMENTATIONS[equation](a);
}

/** Every equation that can run on these inputs, for the side-by-side comparison. */
export function compareBmr(a: Anthropometrics): Array<{ equation: BmrEquation; kcal: number }> {
  const equations: BmrEquation[] = ["mifflin", "harris_benedict", "schofield"];
  if (a.bodyFatPercent !== undefined) equations.push("katch_mcardle");
  return equations.map((equation) => ({ equation, kcal: calculateBmr(equation, a) }));
}
