// BMI and WHO adult categories.
// Source: WHO, "Obesity: preventing and managing the global epidemic" (TRS 894, 2000).

export type BmiCategory =
  | "underweight"
  | "normal"
  | "overweight"
  | "obese_1"
  | "obese_2"
  | "obese_3";

export const BMI_CATEGORY_LABEL: Record<BmiCategory, string> = {
  underweight: "Underweight",
  normal: "Healthy weight",
  overweight: "Overweight",
  obese_1: "Obesity (class I)",
  obese_2: "Obesity (class II)",
  obese_3: "Obesity (class III)",
};

export function calculateBmi(weightKg: number, heightCm: number): number {
  assertPositive(weightKg, "weightKg");
  assertPositive(heightCm, "heightCm");
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/** WHO adult cut-offs. Not valid for under-18s (use BMI-for-age z-scores) or pregnancy. */
export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  if (bmi < 35) return "obese_1";
  if (bmi < 40) return "obese_2";
  return "obese_3";
}

export function assertPositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive number, got ${value}`);
  }
}
