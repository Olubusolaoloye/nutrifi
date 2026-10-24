// Dietitian Pro: a monthly subscription paid up front with Paystack (card, bank transfer or USSD). Nothing renews
// automatically; members pay for 1–12 months at a time and the app reminds them before it ends.
// - Billing only applies once Paystack is set up; until then Pro is free (early access).
// - Verified dietitians get a 30-day free trial, from verification or from billing launch, whichever is later.
// - A lapsed Pro keeps serving existing clients, but loses the Workbench and can't take new clients until they renew.
import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { getProfile, requireUser } from "./helpers";

const DAY_MS = 86_400_000;
export const PRO_TRIAL_MS = 30 * DAY_MS;
export const PRO_MONTH_MS = 30 * DAY_MS;
/** When Pro billing launched: dietitians verified before then get their trial from this date. */
export const PRO_BILLING_LAUNCH = Date.UTC(2026, 9, 24);
export const PRO_MONTHS = [1, 3, 6, 12] as const;

export const proPriceNaira = () => {
  const n = Number(process.env.PRO_PRICE_NAIRA);
  return Number.isInteger(n) && n >= 100 ? n : 7500;
};
export const proBillingLive = () => !!process.env.PAYSTACK_SECRET_KEY || process.env.PAYMENTS_DEMO === "true";

type Ctx = QueryCtx | MutationCtx;

/** Pro access for a verified dietitian (null for everyone else). */
export async function proState(ctx: Ctx, userId: Id<"users">, now = Date.now()) {
  const profile = await getProfile(ctx, userId);
  if (!profile || profile.role !== "dietitian" || profile.verification !== "verified") return null;
  const [verifications, payments] = await Promise.all([
    ctx.db.query("verifications").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ctx.db.query("proPayments").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
  ]);
  const verifiedAt = Math.max(0, ...verifications.filter((x) => x.status === "verified").map((x) => x.reviewedAt ?? x.submittedAt)) || profile.createdAt;
  const trialEndsAt = Math.max(verifiedAt, PRO_BILLING_LAUNCH) + PRO_TRIAL_MS;
  const paidUntil = Math.max(0, ...payments.filter((p) => p.status === "paid").map((p) => p.periodEnd ?? 0)) || null;
  const until = Math.max(trialEndsAt, paidUntil ?? 0);
  const live = proBillingLive();
  return {
    live,
    active: !live || now < until,
    onTrial: now < trialEndsAt && (paidUntil ?? 0) <= trialEndsAt,
    trialEndsAt,
    paidUntil,
    until,
    priceNaira: proPriceNaira(),
  };
}

/** Can members book this dietitian now? Verified, and Pro (or early access). */
export async function isBookable(ctx: Ctx, dietitianId: Id<"users">) {
  return !!(await proState(ctx, dietitianId))?.active;
}

/** The signed-in dietitian's Pro status, for Me, the Workbench and Clients. */
export const status = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const s = await proState(ctx, userId);
    if (!s) return null;
    const history = (await ctx.db.query("proPayments").withIndex("by_user", (q) => q.eq("userId", userId)).collect())
      .filter((p) => p.status === "paid")
      .sort((a, b) => (b.paidAt ?? 0) - (a.paidAt ?? 0))
      .slice(0, 12)
      .map((p) => ({ months: p.months, amountNaira: p.amountNaira, paidAt: new Date(p.paidAt ?? p.createdAt).toISOString(), demo: !!p.demo }));
    return { ...s, history };
  },
});

/* ---------- Payments (called from payments.ts and http.ts) ---------- */

export const checkoutInfo = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const s = await proState(ctx, userId);
    if (!s) throw new ConvexError("Dietitian Pro is for verified dietitians.");
    const user = await ctx.db.get(userId);
    return { email: user?.email ?? null, priceNaira: s.priceNaira };
  },
});

export const createPending = internalMutation({
  args: { userId: v.id("users"), reference: v.string(), months: v.number(), amountNaira: v.number() },
  handler: async (ctx, row) => {
    await ctx.db.insert("proPayments", { ...row, status: "pending", createdAt: Date.now() });
  },
});

/** Paystack confirmed a payment: extend Pro from today, or from the end of the current trial or paid period. */
export const markPaid = internalMutation({
  args: { reference: v.string(), amountKobo: v.number(), demo: v.optional(v.boolean()) },
  handler: async (ctx, { reference, amountKobo, demo }): Promise<"activated" | "already_active" | "unknown" | "amount_mismatch"> => {
    const p = await ctx.db.query("proPayments").withIndex("by_reference", (q) => q.eq("reference", reference)).unique();
    if (!p) return "unknown";
    if (p.status === "paid") return "already_active";
    if (amountKobo !== p.amountNaira * 100) {
      console.error("pro payment amount mismatch", reference, amountKobo, p.amountNaira);
      return "amount_mismatch";
    }
    const now = Date.now();
    const s = await proState(ctx, p.userId, now);
    const start = Math.max(now, s?.until ?? now);
    await ctx.db.patch(p._id, { status: "paid", paidAt: now, periodEnd: start + p.months * PRO_MONTH_MS, demo: demo || undefined });
    return "activated";
  },
});
