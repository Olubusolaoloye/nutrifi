export type Sex = "female" | "male";

export interface Anthropometrics {
  sex: Sex;
  ageYears: number;
  weightKg: number;
  heightCm: number;
  /** Optional, enables Katch-McArdle. */
  bodyFatPercent?: number;
}
