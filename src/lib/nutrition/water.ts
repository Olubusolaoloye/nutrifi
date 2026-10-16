// Daily water target. A simple 35 ml/kg rule of thumb for healthy adults;
// dietitians can override it for clients.
import { assertPositive } from "./bmi";

export const SACHET_ML = 500;

export function dailyWaterTargetMl(weightKg: number): number {
  assertPositive(weightKg, "weightKg");
  return Math.round((weightKg * 35) / 50) * 50;
}
