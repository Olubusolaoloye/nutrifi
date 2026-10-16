// @vitest-environment edge-runtime
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.*s");

const PROFILE = {
  name: "Adaeze",
  sex: "female" as const,
  birthDate: "1996-01-15",
  heightCm: 165,
  activity: "light" as const,
  goal: "lose" as const,
  conditions: [],
};

/** A signed-in client for a new user (Convex Auth reads "userId|sessionId" from the token subject). */
async function signedIn(t: ReturnType<typeof convexTest>, email: string) {
  const userId = await t.run((ctx) => ctx.db.insert("users", { email }));
  const sessionId = await t.run((ctx) => ctx.db.insert("authSessions", { userId, expirationTime: Date.now() + 1e9 }));
  return { userId, as: t.withIdentity({ subject: `${userId}|${sessionId}` }) };
}

beforeEach(() => vi.stubEnv("ADMIN_EMAILS", "admin@nutrifi.ng"));
afterEach(() => vi.unstubAllEnvs());

describe("accounts and profile", () => {
  it("returns nothing when signed out", async () => {
    const t = convexTest(schema, modules);
    expect(await t.query(api.me.snapshot, {})).toBeNull();
  });

  it("creates a profile with the first weight, once", async () => {
    const t = convexTest(schema, modules);
    const { as } = await signedIn(t, "ada@example.com");
    expect((await as.query(api.me.snapshot, {}))!.profile).toBeNull();
    await as.mutation(api.profile.create, { ...PROFILE, role: "consumer", weightKg: 70 });
    const s = (await as.query(api.me.snapshot, {}))!;
    expect(s.email).toBe("ada@example.com");
    expect(s.profile).toMatchObject({ name: "Adaeze", role: "consumer", verification: "none" });
    expect(s.weights.map((w) => w.weightKg)).toEqual([70]);
    await expect(as.mutation(api.profile.create, { ...PROFILE, role: "consumer", weightKg: 70 })).rejects.toThrow(/already exists/);
  });

  it("rejects out-of-range values", async () => {
    const t = convexTest(schema, modules);
    const { as } = await signedIn(t, "ada@example.com");
    await expect(as.mutation(api.profile.create, { ...PROFILE, heightCm: 20, role: "consumer", weightKg: 70 })).rejects.toThrow(/Height/);
  });
});

describe("verification", () => {
  it("students start pending and can't approve themselves", async () => {
    const t = convexTest(schema, modules);
    const { as } = await signedIn(t, "tunde@unn.edu.ng");
    await as.mutation(api.profile.create, { ...PROFILE, name: "Tunde", role: "student", weightKg: 72, credential: "UNN 2022/1234" });
    const s = (await as.query(api.me.snapshot, {}))!;
    expect(s.profile!.verification).toBe("pending");
    expect(s.verification).toMatchObject({ status: "pending", credential: "UNN 2022/1234" });
    // The profile update endpoint has no verification field at all.
    await expect(
      as.mutation(api.profile.update, { verification: "verified" } as unknown as Record<string, never>),
    ).rejects.toThrow();
    await expect(as.query(api.verification.listPending, {})).rejects.toThrow(/Admins only/);
  });

  it("an admin approves or rejects, and the profile follows", async () => {
    const t = convexTest(schema, modules);
    const student = await signedIn(t, "tunde@unn.edu.ng");
    const admin = await signedIn(t, "admin@nutrifi.ng");
    await student.as.mutation(api.profile.create, { ...PROFILE, role: "student", weightKg: 72, credential: "UNN 2022/1234" });

    const queue = await admin.as.query(api.verification.listPending, {});
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ email: "tunde@unn.edu.ng", credential: "UNN 2022/1234", documentUrl: null });

    await admin.as.mutation(api.verification.review, { id: queue[0]._id, decision: "rejected", note: "Matric not found" });
    let s = (await student.as.query(api.me.snapshot, {}))!;
    expect(s.profile!.verification).toBe("rejected");
    expect(s.verification!.reviewerNote).toBe("Matric not found");

    await student.as.mutation(api.verification.submit, { credential: "UNN 2022/12345" });
    const again = await admin.as.query(api.verification.listPending, {});
    await admin.as.mutation(api.verification.review, { id: again[0]._id, decision: "verified" });
    s = (await student.as.query(api.me.snapshot, {}))!;
    expect(s.profile!.verification).toBe("verified");
    await expect(admin.as.mutation(api.verification.review, { id: again[0]._id, decision: "verified" })).rejects.toThrow(/already handled/);
  });

  it("members can't submit verification", async () => {
    const t = convexTest(schema, modules);
    const { as } = await signedIn(t, "ada@example.com");
    await as.mutation(api.profile.create, { ...PROFILE, role: "consumer", weightKg: 70 });
    await expect(as.mutation(api.verification.submit, { credential: "DT/1" })).rejects.toThrow(/Only students and dietitians/);
  });
});

describe("logs and ownership", () => {
  it("keeps each user's data private", async () => {
    const t = convexTest(schema, modules);
    const a = await signedIn(t, "a@example.com");
    const b = await signedIn(t, "b@example.com");
    for (const u of [a, b]) await u.as.mutation(api.profile.create, { ...PROFILE, role: "consumer", weightKg: 70 });
    await a.as.mutation(api.data.addDiaryEntries, { entries: [{ date: "2026-10-16", meal: "Lunch", foodId: "jollof", grams: 140, portionLabel: "2 cooking spoons" }] });
    const entryId = (await a.as.query(api.me.snapshot, {}))!.diary[0]._id;

    expect((await b.as.query(api.me.snapshot, {}))!.diary).toHaveLength(0);
    await expect(b.as.mutation(api.data.removeDiaryEntry, { id: entryId })).rejects.toThrow(/Not found/);
    await a.as.mutation(api.data.removeDiaryEntry, { id: entryId });
    expect((await a.as.query(api.me.snapshot, {}))!.diary).toHaveLength(0);
  });

  it("accumulates water and never goes below zero", async () => {
    const t = convexTest(schema, modules);
    const { as } = await signedIn(t, "a@example.com");
    await as.mutation(api.data.addWater, { date: "2026-10-16", ml: 500 });
    await as.mutation(api.data.addWater, { date: "2026-10-16", ml: 250 });
    await as.mutation(api.data.addWater, { date: "2026-10-16", ml: -1000 });
    await as.mutation(api.data.addWater, { date: "2026-10-17", ml: 500 });
    const water = (await as.query(api.me.snapshot, {}))!.water;
    expect(Object.fromEntries(water.map((w) => [w.date, w.ml]))).toEqual({ "2026-10-16": 0, "2026-10-17": 500 });
  });

  it("upserts and deletes notes and plan slots", async () => {
    const t = convexTest(schema, modules);
    const { as } = await signedIn(t, "a@example.com");
    await as.mutation(api.data.setNote, { date: "2026-10-16", slot: "Lunch", note: { feeling: 4, tags: ["Satisfied"], text: "Good" } });
    await as.mutation(api.data.setNote, { date: "2026-10-16", slot: "Lunch", note: { feeling: 5, tags: [], text: "Great" } });
    await as.mutation(api.data.setPlanSlot, { date: "2026-10-16", meal: "Dinner", recipeId: "egusi-eba" });
    await as.mutation(api.data.setPlanSlot, { date: "2026-10-16", meal: "Dinner", recipeId: "beans-dodo" });
    let s = (await as.query(api.me.snapshot, {}))!;
    expect(s.notes).toHaveLength(1);
    expect(s.notes[0]).toMatchObject({ feeling: 5, text: "Great" });
    expect(s.plan).toEqual([expect.objectContaining({ meal: "Dinner", recipeId: "beans-dodo" })]);
    await as.mutation(api.data.setNote, { date: "2026-10-16", slot: "Lunch", note: null });
    await as.mutation(api.data.setPlanSlot, { date: "2026-10-16", meal: "Dinner", recipeId: null });
    s = (await as.query(api.me.snapshot, {}))!;
    expect(s.notes).toHaveLength(0);
    expect(s.plan).toHaveLength(0);
  });

  it("rejects bad dates", async () => {
    const t = convexTest(schema, modules);
    const { as } = await signedIn(t, "a@example.com");
    await expect(as.mutation(api.data.addWater, { date: "16/10/2026", ml: 500 })).rejects.toThrow(/Invalid date/);
  });
});

describe("import, deletion and waitlist", () => {
  const payload = {
    diary: [{ date: "2026-10-15", meal: "Dinner" as const, foodId: "eba", grams: 250, portionLabel: "Medium wrap" }],
    water: [{ date: "2026-10-15", ml: 1500 }],
    weights: [{ date: "2026-10-01", weightKg: 71 }],
    notes: [],
    plan: [],
    events: [],
    exercises: [{ date: "2026-10-15", activityId: "brisk-walking", minutes: 30, status: "completed" as const }],
  };

  it("imports on-device data once", async () => {
    const t = convexTest(schema, modules);
    const { as } = await signedIn(t, "a@example.com");
    expect((await as.mutation(api.importLocal.importLocal, payload)).imported).toBe(4);
    const s = (await as.query(api.me.snapshot, {}))!;
    expect(s.diary).toHaveLength(1);
    expect(s.exercises).toHaveLength(1);
    await expect(as.mutation(api.importLocal.importLocal, payload)).rejects.toThrow(/already has logs/);
  });

  it("deletes data, and optionally the account", async () => {
    const t = convexTest(schema, modules);
    const { as, userId } = await signedIn(t, "a@example.com");
    await as.mutation(api.profile.create, { ...PROFILE, role: "consumer", weightKg: 70 });
    await as.mutation(api.importLocal.importLocal, payload);
    await as.mutation(api.data.deleteMyData, {});
    const s = (await as.query(api.me.snapshot, {}))!;
    expect(s.profile).toBeNull();
    expect(s.diary.length + s.weights.length + s.water.length + s.exercises.length).toBe(0);

    await as.mutation(api.data.deleteMyData, { deleteAccount: true });
    expect(await t.run((ctx) => ctx.db.get(userId))).toBeNull();
  });

  it("adds each email to the waitlist once", async () => {
    const t = convexTest(schema, modules);
    expect(await t.mutation(api.waitlist.join, { email: "Folake@Example.com ", role: "dietitian" })).toEqual({ alreadyJoined: false });
    expect(await t.mutation(api.waitlist.join, { email: "folake@example.com", role: "dietitian" })).toEqual({ alreadyJoined: true });
    await expect(t.mutation(api.waitlist.join, { email: "not-an-email", role: "member" })).rejects.toThrow(/valid email/);
    expect(await t.run((ctx) => ctx.db.query("waitlist").collect())).toHaveLength(1);
  });
});
