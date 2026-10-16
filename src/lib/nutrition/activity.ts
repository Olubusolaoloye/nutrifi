// Energy burned in physical activity.
// MET values from the Compendium of Physical Activities (Ainsworth BE et al., Med Sci Sports Exerc 2011).
import { assertPositive } from "./bmi";

export interface Activity {
  id: string;
  name: string;
  emoji: string;
  met: number;
  kind: "cardio" | "strength" | "mobility" | "daily";
}

export const ACTIVITIES: Activity[] = [
  { id: "walking", name: "Walking (moderate pace)", emoji: "🚶", met: 3.5, kind: "cardio" },
  { id: "brisk-walking", name: "Brisk walking", emoji: "🚶‍♀️", met: 4.3, kind: "cardio" },
  { id: "jogging", name: "Jogging", emoji: "🏃", met: 7.0, kind: "cardio" },
  { id: "running", name: "Running (~10 km/h)", emoji: "🏃‍♂️", met: 9.8, kind: "cardio" },
  { id: "cycling", name: "Cycling (moderate)", emoji: "🚴", met: 7.5, kind: "cardio" },
  { id: "skipping", name: "Skipping rope", emoji: "🪢", met: 11.8, kind: "cardio" },
  { id: "dancing", name: "Dancing (aerobic)", emoji: "💃", met: 7.3, kind: "cardio" },
  { id: "football", name: "Football (casual)", emoji: "⚽", met: 7.0, kind: "cardio" },
  { id: "swimming", name: "Swimming (moderate)", emoji: "🏊", met: 5.8, kind: "cardio" },
  { id: "hiit", name: "HIIT / circuit training", emoji: "🔥", met: 8.0, kind: "cardio" },
  { id: "strength", name: "Strength training", emoji: "🏋️", met: 5.0, kind: "strength" },
  { id: "bodyweight", name: "Squats, push-ups, lunges", emoji: "💪", met: 3.8, kind: "strength" },
  { id: "yoga", name: "Yoga / stretching", emoji: "🧘", met: 2.5, kind: "mobility" },
  { id: "chores", name: "House chores (cleaning, sweeping)", emoji: "🧹", met: 3.3, kind: "daily" },
];

export function activityById(id: string): Activity | undefined {
  return ACTIVITIES.find((a) => a.id === id);
}

/** kcal = MET × body weight (kg) × duration (hours). */
export function activityKcal(met: number, weightKg: number, minutes: number): number {
  assertPositive(met, "met");
  assertPositive(weightKg, "weightKg");
  if (!Number.isFinite(minutes) || minutes < 0) throw new RangeError(`minutes must be 0 or more, got ${minutes}`);
  return met * weightKg * (minutes / 60);
}
