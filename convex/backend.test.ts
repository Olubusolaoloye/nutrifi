// @vitest-environment edge-runtime
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
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

beforeEach(() => vi.stubEnv("ADMIN_EMAILS", "admin@nutrintel.ng"));
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
    const admin = await signedIn(t, "admin@nutrintel.ng");
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

describe("meal plan portions and preferences", () => {
  it("stores portions with plan slots and saves plan preferences", async () => {
    const t = convexTest(schema, modules);
    const { as } = await signedIn(t, "ada@example.com");
    await as.mutation(api.profile.create, { ...PROFILE, role: "consumer", weightKg: 70 });
    await as.mutation(api.data.replacePlan, { items: [{ date: "2026-10-19", meal: "Lunch", recipeId: "jollof-chicken", portion: 1.5 }] });
    await as.mutation(api.data.setPlanSlot, { date: "2026-10-19", meal: "Dinner", recipeId: "pepper-soup", portion: 0.75 });
    await expect(as.mutation(api.data.setPlanSlot, { date: "2026-10-19", meal: "Dinner", recipeId: "pepper-soup", portion: 9 })).rejects.toThrow(/Portion/);
    const prefs = { cuisines: ["Nigerian" as const], diet: "pescatarian" as const, avoid: ["peanut" as const], budgetPerDay: 3000 };
    await as.mutation(api.settings.updatePlanPrefs, { prefs });
    await expect(as.mutation(api.settings.updatePlanPrefs, { prefs: { ...prefs, budgetPerDay: 10 } })).rejects.toThrow(/budget/);
    const s = (await as.query(api.me.snapshot, {}))!;
    expect(s.plan.map((p) => [p.meal, p.portion])).toEqual(expect.arrayContaining([["Lunch", 1.5], ["Dinner", 0.75]]));
    expect(s.planPrefs).toEqual(prefs);
  });
});

const REMINDERS = {
  push: true,
  whatsapp: true,
  meals: {
    Breakfast: { on: true, time: "07:30" },
    Lunch: { on: true, time: "13:00" },
    Dinner: { on: true, time: "19:00" },
    Snacks: { on: false, time: "16:00" },
  },
  water: { on: false, everyHours: 2, from: "08:00", to: "20:00" },
  weighIn: { on: false, day: 1, time: "07:00" },
  planning: { on: false, day: 0, time: "17:00" },
  appointments: { on: true, minutesBefore: 60 },
  utcOffsetMinutes: 60,
};
const SUB = { endpoint: "https://fcm.googleapis.com/fcm/send/abc", p256dh: "BKey", auth: "authsecret" };

describe("reminders", () => {
  it("validates and saves reminder settings", async () => {
    const t = convexTest(schema, modules);
    const { as } = await signedIn(t, "ada@example.com");
    await expect(as.mutation(api.settings.updateReminders, { reminders: { ...REMINDERS, water: { ...REMINDERS.water, everyHours: 0 } } })).rejects.toThrow(/Water/);
    await as.mutation(api.settings.updateReminders, { reminders: REMINDERS });
    await as.mutation(api.profile.create, { ...PROFILE, role: "consumer", weightKg: 70 });
    expect((await as.query(api.me.snapshot, {}))!.reminders).toEqual(REMINDERS);
  });

  it("keeps one owner per push endpoint", async () => {
    const t = convexTest(schema, modules);
    const a = await signedIn(t, "a@example.com");
    const b = await signedIn(t, "b@example.com");
    await a.as.mutation(api.reminders.savePushSubscription, SUB);
    await b.as.mutation(api.reminders.savePushSubscription, SUB);
    expect((await a.as.query(api.reminders.myChannels, {})).pushEndpoints).toEqual([]);
    expect((await b.as.query(api.reminders.myChannels, {})).pushEndpoints).toEqual([SUB.endpoint]);
    await expect(a.as.mutation(api.reminders.savePushSubscription, { ...SUB, endpoint: "http://insecure" })).rejects.toThrow();
    // Someone else can't remove your subscription.
    await a.as.mutation(api.reminders.removePushSubscription, { endpoint: SUB.endpoint });
    expect((await b.as.query(api.reminders.myChannels, {})).pushEndpoints).toEqual([SUB.endpoint]);
  });

  it("confirms a WhatsApp number with a code before using it", async () => {
    vi.stubEnv("WHATSAPP_TOKEN", "token");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "123");
    const t = convexTest(schema, modules);
    const { as } = await signedIn(t, "ada@example.com");
    await expect(as.mutation(api.reminders.startWhatsApp, { phone: "123" })).rejects.toThrow(/valid phone/);
    expect(await as.mutation(api.reminders.startWhatsApp, { phone: "0803 123 4567" })).toEqual({ phone: "+2348031234567" });
    const jobs = await t.run((ctx) => ctx.db.system.query("_scheduled_functions").collect());
    const code = (jobs.at(-1)!.args[0] as { code: string }).code;
    expect(code).toMatch(/^\d{6}$/);
    expect((await as.query(api.reminders.myChannels, {})).whatsapp).toMatchObject({ verified: false, codePending: true });
    await expect(as.mutation(api.reminders.confirmWhatsApp, { code: code === "000000" ? "111111" : "000000" })).rejects.toThrow(/isn't right/);
    await as.mutation(api.reminders.confirmWhatsApp, { code });
    expect((await as.query(api.reminders.myChannels, {})).whatsapp).toMatchObject({ phone: "+2348031234567", verified: true });
    // Rate limit: 3 codes an hour.
    await as.mutation(api.reminders.startWhatsApp, { phone: "08031234567" });
    await as.mutation(api.reminders.startWhatsApp, { phone: "08031234567" });
    await expect(as.mutation(api.reminders.startWhatsApp, { phone: "08031234567" })).rejects.toThrow(/Too many/);
  });

  it("refuses WhatsApp when the provider isn't configured", async () => {
    const t = convexTest(schema, modules);
    const { as } = await signedIn(t, "ada@example.com");
    expect((await t.query(api.reminders.config, {})).whatsappAvailable).toBe(false);
    await expect(as.mutation(api.reminders.startWhatsApp, { phone: "08031234567" })).rejects.toThrow(/aren't switched on/);
  });

  it("claims due reminders once, with the planned dish", async () => {
    const t = convexTest(schema, modules);
    const { as, userId } = await signedIn(t, "ada@example.com");
    await as.mutation(api.profile.create, { ...PROFILE, role: "consumer", weightKg: 70 });
    await as.mutation(api.settings.updateReminders, { reminders: REMINDERS });
    await as.mutation(api.data.setPlanSlot, { date: "2026-10-20", meal: "Lunch", recipeId: "jollof-chicken", portion: 1.5 });
    const lunch = Date.parse("2026-10-20T12:05:00Z"); // 13:05 in Lagos

    // No channel yet: nothing to deliver, nothing logged.
    expect(await t.mutation(internal.reminders.claimDue, { now: lunch })).toEqual([]);

    await as.mutation(api.reminders.savePushSubscription, SUB);
    const [d] = await t.mutation(internal.reminders.claimDue, { now: lunch });
    expect(d.name).toBe("Adaeze");
    expect(d.push).toEqual([SUB]);
    expect(d.whatsapp).toBeNull();
    expect(d.messages).toEqual([expect.objectContaining({ key: "2026-10-20|meal|Lunch" })]);
    expect(d.messages[0].body).toContain("Jollof rice with grilled chicken (1½ servings)");
    // The next run inside the same window sends nothing.
    expect(await t.mutation(internal.reminders.claimDue, { now: lunch + 5 * 60_000 })).toEqual([]);
    expect(await t.query(internal.reminders.logCount, { userId })).toBe(1);
  });
});

/* ---------- Paid interventions & client tools ---------- */

const INTAKE = { goals: "Lower my blood sugar", conditions: ["diabetes" as const], medications: "Metformin 500 mg", typicalDay: "Bread and tea, rice at lunch", allergies: "", consent: true };

async function dietitian(t: ReturnType<typeof convexTest>, email: string, opts: { verified?: boolean; bio?: boolean } = {}) {
  const d = await signedIn(t, email);
  await d.as.mutation(api.profile.create, { ...PROFILE, name: "Dr Funke", role: "dietitian", weightKg: 65, credential: "LDCN 1234" });
  if (opts.verified !== false) {
    await t.run(async (ctx) => {
      const p = (await ctx.db.query("profiles").collect()).find((row) => row.userId === d.userId);
      await ctx.db.patch(p!._id, { verification: "verified" });
    });
    if (opts.bio !== false) await d.as.mutation(api.clients.saveProfile, { bio: "Diabetes specialist in Lagos.", languages: ["English", "Yoruba"], yearsExperience: 8 });
  }
  return d;
}

/** Dietitian with a diabetes offering, a member enrolled and paid (demo). */
async function paidSetup() {
  vi.stubEnv("PAYMENTS_DEMO", "true");
  const t = convexTest(schema, modules);
  const d = await dietitian(t, "funke@clinic.ng");
  await d.as.mutation(api.clients.saveOffering, { programmeId: "diabetes", priceNaira: 40000, active: true });
  const [offering] = await t.query(api.interventions.catalogue, {});
  const m = await signedIn(t, "ada@example.com");
  await m.as.mutation(api.profile.create, { ...PROFILE, conditions: ["diabetes"], role: "consumer", weightKg: 80 });
  const enrolmentId = await m.as.mutation(api.interventions.enrol, { offeringId: offering.id as Id<"offerings">, intake: INTAKE });
  expect(await m.as.action(api.payments.startPayment, { enrolmentId })).toEqual({ demo: true });
  return { t, d, m, enrolmentId, offeringId: offering.id as Id<"offerings"> };
}

describe("dietitian offerings", () => {
  it("only verified dietitians with a bio can offer programmes, at a price in range", async () => {
    const t = convexTest(schema, modules);
    const pending = await dietitian(t, "new@clinic.ng", { verified: false });
    await expect(pending.as.mutation(api.clients.saveOffering, { programmeId: "diabetes", priceNaira: 40000, active: true })).rejects.toThrow(/verified dietitians/);
    const noBio = await dietitian(t, "nobio@clinic.ng", { bio: false });
    await expect(noBio.as.mutation(api.clients.saveOffering, { programmeId: "diabetes", priceNaira: 40000, active: true })).rejects.toThrow(/bio/);
    const d = await dietitian(t, "funke@clinic.ng");
    await expect(d.as.mutation(api.clients.saveOffering, { programmeId: "diabetes", priceNaira: 999, active: true })).rejects.toThrow(/between/);
    await d.as.mutation(api.clients.saveOffering, { programmeId: "diabetes", priceNaira: 40000, active: true });
    const cat = await t.query(api.interventions.catalogue, {});
    expect(cat).toEqual([expect.objectContaining({ programmeId: "diabetes", priceNaira: 40000, dietitian: expect.objectContaining({ name: "Dr Funke", languages: ["English", "Yoruba"] }) })]);
    await d.as.mutation(api.clients.saveOffering, { programmeId: "diabetes", priceNaira: 40000, active: false });
    expect(await t.query(api.interventions.catalogue, {})).toEqual([]);
  });
});

describe("enrolling and paying", () => {
  it("needs consent, and doesn't activate without a real or demo payment", async () => {
    const t = convexTest(schema, modules);
    const d = await dietitian(t, "funke@clinic.ng");
    await d.as.mutation(api.clients.saveOffering, { programmeId: "diabetes", priceNaira: 40000, active: true });
    const [offering] = await t.query(api.interventions.catalogue, {});
    const m = await signedIn(t, "ada@example.com");
    await m.as.mutation(api.profile.create, { ...PROFILE, role: "consumer", weightKg: 80 });
    const offeringId = offering.id as Id<"offerings">;
    await expect(m.as.mutation(api.interventions.enrol, { offeringId, intake: { ...INTAKE, consent: false } })).rejects.toThrow(/agree/);
    await expect(d.as.mutation(api.interventions.enrol, { offeringId, intake: INTAKE })).rejects.toThrow(/own programme/);
    const enrolmentId = await m.as.mutation(api.interventions.enrol, { offeringId, intake: INTAKE });
    // Enrolling again reuses the unpaid enrolment.
    expect(await m.as.mutation(api.interventions.enrol, { offeringId, intake: INTAKE })).toBe(enrolmentId);
    await expect(m.as.action(api.payments.startPayment, { enrolmentId })).rejects.toThrow(/aren't switched on/);
    expect((await m.as.query(api.interventions.myEnrolments, {}))[0]).toMatchObject({ status: "pending_payment", priceNaira: 40000 });
    // The dietitian can't see unpaid clients.
    expect(await d.as.query(api.clients.myClients, {})).toEqual([]);
    await expect(d.as.query(api.clients.clientDetail, { enrolmentId })).rejects.toThrow(/Not found/);
    await m.as.mutation(api.interventions.cancelPending, { enrolmentId });
    expect(await m.as.query(api.interventions.myEnrolments, {})).toEqual([]);
  });

  it("activates on a correctly signed Paystack webhook with the exact amount, once", async () => {
    vi.stubEnv("PAYSTACK_SECRET_KEY", "sk_test_secret");
    const t = convexTest(schema, modules);
    const d = await dietitian(t, "funke@clinic.ng");
    await d.as.mutation(api.clients.saveOffering, { programmeId: "weight-loss", priceNaira: 30000, active: true });
    const [offering] = await t.query(api.interventions.catalogue, {});
    const m = await signedIn(t, "ada@example.com");
    await m.as.mutation(api.profile.create, { ...PROFILE, role: "consumer", weightKg: 80 });
    const enrolmentId = await m.as.mutation(api.interventions.enrol, { offeringId: offering.id as Id<"offerings">, intake: INTAKE });
    await t.mutation(internal.interventions.setPaymentRef, { enrolmentId, reference: "nf_ref1" });

    const send = async (amount: number, secret = "sk_test_secret") => {
      const body = JSON.stringify({ event: "charge.success", data: { reference: "nf_ref1", amount, currency: "NGN", status: "success" } });
      const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
      const sig = [...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)))].map((b) => b.toString(16).padStart(2, "0")).join("");
      return t.fetch("/paystack/webhook", { method: "POST", body, headers: { "x-paystack-signature": sig } });
    };
    expect((await send(3_000_000, "wrong")).status).toBe(401);
    expect((await send(100)).status).toBe(200); // underpaid: ignored
    expect((await m.as.query(api.interventions.myEnrolments, {}))[0].status).toBe("pending_payment");
    expect((await send(3_000_000)).status).toBe(200);
    const [e] = await m.as.query(api.interventions.myEnrolments, {});
    expect(e).toMatchObject({ status: "active", demoPayment: false });
    expect(e.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(await t.mutation(internal.interventions.markPaid, { reference: "nf_ref1", amountKobo: 3_000_000 })).toBe("already_active");
    // Real payments count towards earnings: ₦30,000 − 20% fee.
    expect((await d.as.query(api.clients.myPractice, {})).earnings).toMatchObject({ grossNaira: 30000, feeNaira: 6000, netNaira: 24000, balanceNaira: 24000, activeClients: 1 });
  });
});

describe("client tools", () => {
  it("gives the dietitian the client's logs, and nobody else", async () => {
    const { t, d, m, enrolmentId } = await paidSetup();
    await m.as.mutation(api.data.addDiaryEntries, { entries: [{ date: "2026-10-20", meal: "Lunch", foodId: "jollof", grams: 280, portionLabel: "4 spoons" }] });
    const [summary] = await d.as.query(api.clients.myClients, {});
    expect(summary).toMatchObject({ enrolmentId, name: "Adaeze", programmeId: "diabetes", status: "active", latestWeightKg: 80 });
    const detail = await d.as.query(api.clients.clientDetail, { enrolmentId });
    expect(detail.intake.medications).toBe("Metformin 500 mg");
    expect(detail.weights).toEqual([expect.objectContaining({ weightKg: 80 })]);

    const other = await dietitian(t, "other@clinic.ng");
    await expect(other.as.query(api.clients.clientDetail, { enrolmentId })).rejects.toThrow(/Not found/);
    await expect(other.as.mutation(api.clients.setTarget, { enrolmentId, target: { kcal: 1800, carbsPercent: 45, proteinPercent: 20, fatPercent: 35, setAt: "" } })).rejects.toThrow(/Not found/);
    await expect(m.as.query(api.clients.clientDetail, { enrolmentId })).rejects.toThrow(/verified dietitians/);
  });

  it("sets the member's target, sends a plan, approves supplements and checks in", async () => {
    const { d, m, enrolmentId } = await paidSetup();
    expect((await m.as.query(api.me.snapshot, {}))!.dietitianTarget).toBeNull();
    await expect(d.as.mutation(api.clients.setTarget, { enrolmentId, target: { kcal: 1800, carbsPercent: 60, proteinPercent: 20, fatPercent: 35, setAt: "" } })).rejects.toThrow(/100%/);
    await d.as.mutation(api.clients.setTarget, { enrolmentId, target: { kcal: 1750, carbsPercent: 45, proteinPercent: 20, fatPercent: 35, note: "Carb-aware", setAt: "" } });
    expect((await m.as.query(api.me.snapshot, {}))!.dietitianTarget).toMatchObject({ kcal: 1750, carbsPercent: 45 });

    await expect(d.as.mutation(api.clients.sendPlan, { enrolmentId, weekStart: "2026-10-19", items: [{ date: "2026-10-30", meal: "Lunch", recipeId: "okra-eba" }] })).rejects.toThrow(/chosen week/);
    await d.as.mutation(api.clients.sendPlan, { enrolmentId, weekStart: "2026-10-19", items: [{ date: "2026-10-19", meal: "Lunch", recipeId: "okra-eba", portion: 1.25 }] });
    const snap = (await m.as.query(api.me.snapshot, {}))!;
    expect(snap.plan).toEqual([expect.objectContaining({ date: "2026-10-19", meal: "Lunch", recipeId: "okra-eba", portion: 1.25 })]);

    await d.as.mutation(api.clients.addAdjunct, { enrolmentId, name: "Folic acid", dose: "400 µg", timing: "Morning", reason: "Planning pregnancy" });
    await d.as.mutation(api.clients.addCheckIn, { enrolmentId, summary: "Good first week", nextSteps: "Swap white bread for oats twice a week", weightKg: 79.4 });
    await d.as.mutation(api.interventions.sendMessage, { enrolmentId, text: "Welcome! Your plan is ready." });
    const [e] = await m.as.query(api.interventions.myEnrolments, {});
    expect(e.adjuncts).toEqual([expect.objectContaining({ name: "Folic acid", approvedBy: "Dr Funke" })]);
    expect(e.checkIns).toEqual([expect.objectContaining({ week: 1, summary: "Good first week", weightKg: 79.4 })]);
    expect(e.planWeekStart).toBe("2026-10-19");
    expect(e.messages).toEqual([expect.objectContaining({ fromMe: false, senderName: "Dr Funke", text: "Welcome! Your plan is ready." })]);
    expect(e.unread).toBe(1);
    await m.as.mutation(api.interventions.markRead, { enrolmentId });
    expect((await m.as.query(api.interventions.myEnrolments, {}))[0].unread).toBe(0);

    await m.as.mutation(api.interventions.sendMessage, { enrolmentId, text: "Thank you!" });
    expect((await d.as.query(api.clients.myClients, {}))[0].unread).toBe(1);
    // Members can't add supplements for themselves.
    await expect(m.as.mutation(api.clients.addAdjunct, { enrolmentId, name: "Anything", dose: "", timing: "", reason: "" })).rejects.toThrow();

    await d.as.mutation(api.clients.completeEnrolment, { enrolmentId });
    expect((await m.as.query(api.me.snapshot, {}))!.dietitianTarget).toBeNull();
    await expect(m.as.mutation(api.interventions.sendMessage, { enrolmentId, text: "Hi" })).rejects.toThrow(/Messages open/);
    // Completed programmes keep the history but no longer share health logs.
    expect((await d.as.query(api.clients.clientDetail, { enrolmentId })).weights).toEqual([]);
  });

  it("doesn't count demo payments as earnings, and admins record payouts up to the balance", async () => {
    const { t, d } = await paidSetup();
    expect((await d.as.query(api.clients.myPractice, {})).earnings).toMatchObject({ grossNaira: 0, activeClients: 1 });
    const admin = await signedIn(t, "admin@nutrintel.ng");
    await expect(admin.as.mutation(api.clients.recordPayout, { dietitianId: d.userId, amountNaira: 100, reference: "TRF1" })).rejects.toThrow(/balance/);
    await expect(d.as.query(api.clients.payoutsOverview, {})).rejects.toThrow(/Admins only/);
  });

  it("deleting a member's data keeps only the payment record", async () => {
    const { d, m, enrolmentId } = await paidSetup();
    await d.as.mutation(api.interventions.sendMessage, { enrolmentId, text: "Hello" });
    await m.as.mutation(api.data.deleteMyData, {});
    const detail = await d.as.query(api.clients.clientDetail, { enrolmentId });
    expect(detail).toMatchObject({ name: "Deleted member", status: "completed", messages: [] });
    expect(detail.intake.medications).toBe("");
  });
});

describe("member messages", () => {
  async function member(t: ReturnType<typeof convexTest>, email: string, name: string) {
    const m = await signedIn(t, email);
    await m.as.mutation(api.profile.create, { ...PROFILE, name, role: "consumer", weightKg: 70 });
    return m;
  }
  const PLAN = { title: "Week of 20 Oct", items: [{ day: 0, meal: "Breakfast" as const, recipeId: "akara-pap" }, { day: 2, meal: "Dinner" as const, recipeId: "egusi-eba", portion: 1.5 }] };

  it("finds a member by @username and keeps one chat per pair", async () => {
    const t = convexTest(schema, modules);
    const ada = await member(t, "ada@example.com", "Ada");
    const bisi = await member(t, "bisi@example.com", "Bisi");
    const id = await ada.as.mutation(api.social.start, { username: " @Bisi " });
    expect(await bisi.as.mutation(api.social.start, { username: "ada" })).toBe(id);
    await expect(ada.as.mutation(api.social.start, { username: "nobody" })).rejects.toThrow(/no Nutrintel member/);
    await expect(ada.as.mutation(api.social.start, { username: "ada" })).rejects.toThrow(/your own username/);
    // Email addresses no longer find anyone.
    await expect(ada.as.mutation(api.social.start, { username: "bisi@example.com" })).rejects.toThrow(/no Nutrintel member/);
  });

  it("sends text and a meal plan, counts unread and marks read", async () => {
    const t = convexTest(schema, modules);
    const ada = await member(t, "ada@example.com", "Ada");
    const bisi = await member(t, "bisi@example.com", "Bisi");
    const id = await ada.as.mutation(api.social.start, { username: "bisi" });
    await ada.as.mutation(api.social.send, { conversationId: id, text: "Try my plan!" });
    await ada.as.mutation(api.social.send, { conversationId: id, text: "", plan: PLAN });

    const inbox = (await bisi.as.query(api.social.inbox, {}))!;
    expect(inbox).toMatchObject([{ id, name: "Ada", unread: 2, lastText: "📅 Week of 20 Oct", lastFromMe: false }]);
    const th = await bisi.as.query(api.social.thread, { conversationId: id });
    expect(th.name).toBe("Ada");
    expect(th.messages.map((m) => [m.fromMe, m.text, m.plan?.items.length ?? 0])).toEqual([[false, "Try my plan!", 0], [false, "", 2]]);
    await bisi.as.mutation(api.social.markRead, { conversationId: id });
    expect((await bisi.as.query(api.social.inbox, {}))![0].unread).toBe(0);
    expect((await ada.as.query(api.social.inbox, {}))![0]).toMatchObject({ name: "Bisi", unread: 0, lastFromMe: true });
  });

  it("keeps chats private and checks shared plans", async () => {
    const t = convexTest(schema, modules);
    const ada = await member(t, "ada@example.com", "Ada");
    await member(t, "bisi@example.com", "Bisi");
    const eve = await member(t, "eve@example.com", "Eve");
    const id = await ada.as.mutation(api.social.start, { username: "bisi" });
    await expect(eve.as.query(api.social.thread, { conversationId: id })).rejects.toThrow(/Not found/);
    await expect(eve.as.mutation(api.social.send, { conversationId: id, text: "hi" })).rejects.toThrow(/Not found/);
    await expect(ada.as.mutation(api.social.send, { conversationId: id, text: "", plan: { title: "x", items: [{ day: 7, meal: "Lunch", recipeId: "moimoi" }] } })).rejects.toThrow(/Plan day/);
    await expect(ada.as.mutation(api.social.send, { conversationId: id, text: "x".repeat(2001) })).rejects.toThrow(/too long/);
  });

  it("blocking stops messages both ways until the blocker unblocks", async () => {
    const t = convexTest(schema, modules);
    const ada = await member(t, "ada@example.com", "Ada");
    const bisi = await member(t, "bisi@example.com", "Bisi");
    const id = await ada.as.mutation(api.social.start, { username: "bisi" });
    await bisi.as.mutation(api.social.setBlocked, { conversationId: id, blocked: true });
    await expect(ada.as.mutation(api.social.send, { conversationId: id, text: "hello?" })).rejects.toThrow(/can't send/);
    await expect(bisi.as.mutation(api.social.send, { conversationId: id, text: "hi" })).rejects.toThrow(/can't send/);
    await ada.as.mutation(api.social.setBlocked, { conversationId: id, blocked: false });
    expect((await ada.as.query(api.social.thread, { conversationId: id })).blocked).toBe(true);
    await bisi.as.mutation(api.social.setBlocked, { conversationId: id, blocked: false });
    await ada.as.mutation(api.social.send, { conversationId: id, text: "hello again" });
  });

  it("deleting your data removes your chats for both people", async () => {
    const t = convexTest(schema, modules);
    const ada = await member(t, "ada@example.com", "Ada");
    const bisi = await member(t, "bisi@example.com", "Bisi");
    const id = await ada.as.mutation(api.social.start, { username: "bisi" });
    await ada.as.mutation(api.social.send, { conversationId: id, text: "hi" });
    await ada.as.mutation(api.data.deleteMyData, {});
    expect(await bisi.as.query(api.social.inbox, {})).toEqual([]);
    expect(await t.run((ctx) => ctx.db.query("directMessages").collect())).toEqual([]);
  });
});

describe("admin dashboard", () => {
  it("is admin-only", async () => {
    const t = convexTest(schema, modules);
    const { as } = await signedIn(t, "ada@example.com");
    await as.mutation(api.profile.create, { ...PROFILE, role: "consumer", weightKg: 70 });
    await expect(as.query(api.admin.overview, {})).rejects.toThrow(/Admins only/);
    await expect(as.query(api.admin.feed, {})).rejects.toThrow(/Admins only/);
    await expect(as.query(api.admin.people, {})).rejects.toThrow(/Admins only/);
  });

  it("counts people, activity and messages, without message text", async () => {
    const t = convexTest(schema, modules);
    const admin = await signedIn(t, "admin@nutrintel.ng");
    const ada = await signedIn(t, "ada@example.com");
    const bisi = await signedIn(t, "bisi@example.com");
    await signedIn(t, "half@example.com"); // never finished onboarding
    await ada.as.mutation(api.profile.create, { ...PROFILE, name: "Ada", role: "consumer", weightKg: 70 });
    await bisi.as.mutation(api.profile.create, { ...PROFILE, name: "Bisi", role: "consumer", conditions: ["diabetes"], weightKg: 80 });
    await ada.as.mutation(api.data.addDiaryEntries, { entries: [{ date: "2026-10-19", meal: "Lunch", foodId: "jollof", grams: 300, portionLabel: "1 plate" }] });
    const id = await ada.as.mutation(api.social.start, { username: "bisi" });
    await ada.as.mutation(api.social.send, { conversationId: id, text: "secret hello" });

    const o = await admin.as.query(api.admin.overview, {});
    expect(o.people).toMatchObject({ accounts: 4, profiles: 2, unfinished: 2, members: 2, withConditions: 1, newThisWeek: 4 });
    expect(o.active).toMatchObject({ today: 1, week: 1, month: 1 });
    expect(o.usage30).toMatchObject({ foodLogs: 1, memberMessages: 1, planShares: 0 });
    expect(o.messaging).toEqual({ chats: 1, blockedChats: 0 });
    expect(o.trends.signups).toHaveLength(30);
    expect(o.trends.signups.at(-1)!.count).toBe(4);
    expect(o.trends.activeMembers.at(-1)!.count).toBe(1);

    const feed = await admin.as.query(api.admin.feed, {});
    expect(feed.map((f) => f.kind)).toEqual(expect.arrayContaining(["signup", "profile", "chat"]));
    expect(JSON.stringify(feed)).not.toContain("secret hello");
    expect(JSON.stringify(o)).not.toContain("secret hello");

    const people = await admin.as.query(api.admin.people, { search: "bis" });
    expect(people).toMatchObject([{ email: "bisi@example.com", name: "Bisi", role: "consumer", hasCondition: true, lastActiveAt: null }]);
    const all = await admin.as.query(api.admin.people, {});
    expect(all.find((p) => p.email === "ada@example.com")!.lastActiveAt).not.toBeNull();
    expect(all.find((p) => p.email === "half@example.com")).toMatchObject({ name: null, role: null });
  });
});

describe("admin audit log", () => {
  it("records approvals, rejections and payouts with who did them, and only admins can read it", async () => {
    const t = convexTest(schema, modules);
    const student = await signedIn(t, "tunde@unn.edu.ng");
    const admin = await signedIn(t, "admin@nutrintel.ng");
    await student.as.mutation(api.profile.create, { ...PROFILE, name: "Tunde", role: "student", weightKg: 72, credential: "UNN 2022/1234" });
    const [req] = await admin.as.query(api.verification.listPending, {});
    await admin.as.mutation(api.verification.review, { id: req._id, decision: "rejected", note: "Matric not found" });
    await student.as.mutation(api.verification.submit, { credential: "UNN 2022/12345" });
    const [again] = await admin.as.query(api.verification.listPending, {});
    await admin.as.mutation(api.verification.review, { id: again._id, decision: "verified" });

    const log = await admin.as.query(api.admin.log, {});
    expect(log.map((l) => [l.action, l.by])).toEqual([
      ["verification_approved", "admin@nutrintel.ng"],
      ["verification_rejected", "admin@nutrintel.ng"],
    ]);
    expect(log[1].detail).toBe("Tunde as a student (UNN 2022/1234) · note: Matric not found");
    await expect(student.as.query(api.admin.log, {})).rejects.toThrow(/Admins only/);
  });

  it("logs a payout only when it's recorded", async () => {
    const { t, d, enrolmentId } = await paidSetup();
    // Make the demo enrolment a real payment so the dietitian is owed money.
    await t.run((ctx) => ctx.db.patch(enrolmentId, { demoPayment: undefined }));
    const admin = await signedIn(t, "admin@nutrintel.ng");
    await expect(admin.as.mutation(api.clients.recordPayout, { dietitianId: d.userId, amountNaira: 10_000_000, reference: "TRF0" })).rejects.toThrow(/balance/);
    await admin.as.mutation(api.clients.recordPayout, { dietitianId: d.userId, amountNaira: 1000, reference: "TRF1" });
    expect(await admin.as.query(api.admin.log, {})).toMatchObject([{ action: "payout_recorded", detail: "₦1,000 to Dr Funke · ref TRF1", by: "admin@nutrintel.ng" }]);
  });
});

describe("usernames", () => {
  async function member(t: ReturnType<typeof convexTest>, email: string, name: string) {
    const m = await signedIn(t, email);
    await m.as.mutation(api.profile.create, { ...PROFILE, name, role: "consumer", weightKg: 70 });
    return m;
  }
  const usernameOf = async (m: Awaited<ReturnType<typeof member>>) => (await m.as.query(api.me.snapshot, {}))!.profile!.username;

  it("are made from the name, unique, and changeable within the rules", async () => {
    const t = convexTest(schema, modules);
    const a = await member(t, "a@example.com", "Ada Okafor");
    const b = await member(t, "b@example.com", "Ada Okafor");
    const c = await member(t, "c@example.com", "Ọ̀lá 12");
    expect(await usernameOf(a)).toBe("adaokafor");
    expect(await usernameOf(b)).toMatch(/^adaokafor\d+$/);
    expect(await usernameOf(c)).toBe("ola12");

    expect(await a.as.query(api.profile.usernameAvailable, { username: "@DevOlu" })).toBeNull();
    expect(await a.as.query(api.profile.usernameAvailable, { username: (await usernameOf(b))! })).toMatch(/taken/);
    expect(await a.as.query(api.profile.usernameAvailable, { username: "adaokafor" })).toBeNull(); // already mine
    expect(await a.as.query(api.profile.usernameAvailable, { username: "ab" })).toMatch(/3 to 20/);
    expect(await a.as.query(api.profile.usernameAvailable, { username: "1ada" })).toMatch(/Start with a letter/);
    expect(await a.as.query(api.profile.usernameAvailable, { username: "ada..o" })).toMatch(/Dots/);
    expect(await a.as.query(api.profile.usernameAvailable, { username: "ad min" })).toMatch(/only letters/);
    expect(await a.as.query(api.profile.usernameAvailable, { username: "Nutrintel" })).toMatch(/reserved/);

    expect(await a.as.mutation(api.profile.setUsername, { username: "@DevOlu" })).toBe("devolu");
    await expect(b.as.mutation(api.profile.setUsername, { username: "devolu" })).rejects.toThrow(/taken/);
    expect(await b.as.query(api.social.findPeople, { q: "@dev" })).toEqual([{ username: "devolu", name: "Ada Okafor", role: "consumer", verified: false }]);
    expect(await b.as.query(api.social.findPeople, { q: "d" })).toEqual([]);
    // You don't find yourself.
    expect(await a.as.query(api.social.findPeople, { q: "dev" })).toEqual([]);
  });

  it("older profiles get one on their next visit", async () => {
    const t = convexTest(schema, modules);
    const a = await member(t, "a@example.com", "Bisi");
    await t.run(async (ctx) => {
      const p = await ctx.db.query("profiles").first();
      await ctx.db.patch(p!._id, { username: undefined });
    });
    expect(await usernameOf(a)).toBeUndefined();
    expect(await a.as.mutation(api.profile.ensureUsername, {})).toBe("bisi");
    expect(await a.as.mutation(api.profile.ensureUsername, {})).toBe("bisi");
  });
});

describe("shared grocery lists", () => {
  async function member(t: ReturnType<typeof convexTest>, email: string, name: string) {
    const m = await signedIn(t, email);
    await m.as.mutation(api.profile.create, { ...PROFILE, name, role: "consumer", weightKg: 70 });
    return m;
  }
  const LIST = {
    title: "Groceries · week of 19 Oct",
    people: 2,
    items: [
      { key: "rice", name: "Rice", category: "Grains", qty: 1.5, unit: "kg", costNaira: 2700 },
      { key: "tomatoes", name: "Tomatoes", category: "Veggies", qty: 1, unit: "kg", costNaira: 2000 },
    ],
  };

  it("sends a list that either person can tick off", async () => {
    const t = convexTest(schema, modules);
    const ada = await member(t, "ada@example.com", "Ada");
    const bisi = await member(t, "bisi@example.com", "Bisi");
    const id = await ada.as.mutation(api.social.start, { username: "bisi" });
    // Items Ada already bought arrive ticked; unknown keys are dropped.
    await ada.as.mutation(api.social.send, { conversationId: id, text: "", grocery: LIST, checked: ["rice", "nonsense"] });
    expect((await bisi.as.query(api.social.inbox, {}))![0].lastText).toBe("🧺 Groceries · week of 19 Oct");

    let msg = (await bisi.as.query(api.social.thread, { conversationId: id })).messages[0];
    expect(msg.grocery!.items).toHaveLength(2);
    expect(msg.checked).toEqual(["rice"]);
    await bisi.as.mutation(api.social.tickGroceryItem, { messageId: msg.id, key: "tomatoes", done: true });
    await ada.as.mutation(api.social.tickGroceryItem, { messageId: msg.id, key: "rice", done: false });
    msg = (await ada.as.query(api.social.thread, { conversationId: id })).messages[0];
    expect(msg.checked).toEqual(["tomatoes"]);
    await expect(bisi.as.mutation(api.social.tickGroceryItem, { messageId: msg.id, key: "bread", done: true })).rejects.toThrow(/Not found/);
  });

  it("keeps lists private, checks them, and stops ticks when blocked", async () => {
    const t = convexTest(schema, modules);
    const ada = await member(t, "ada@example.com", "Ada");
    const bisi = await member(t, "bisi@example.com", "Bisi");
    const eve = await member(t, "eve@example.com", "Eve");
    const id = await ada.as.mutation(api.social.start, { username: "bisi" });
    await ada.as.mutation(api.social.send, { conversationId: id, text: "", grocery: LIST });
    const msg = (await ada.as.query(api.social.thread, { conversationId: id })).messages[0];
    await expect(eve.as.mutation(api.social.tickGroceryItem, { messageId: msg.id, key: "rice", done: true })).rejects.toThrow(/Not found/);
    await expect(ada.as.mutation(api.social.send, { conversationId: id, text: "", grocery: { ...LIST, items: [] } })).rejects.toThrow(/1 to 80/);
    await expect(ada.as.mutation(api.social.send, { conversationId: id, text: "", grocery: { ...LIST, people: 40 } })).rejects.toThrow(/People/);
    await bisi.as.mutation(api.social.setBlocked, { conversationId: id, blocked: true });
    await expect(bisi.as.mutation(api.social.tickGroceryItem, { messageId: msg.id, key: "rice", done: true })).rejects.toThrow(/can't change/);
  });
});
