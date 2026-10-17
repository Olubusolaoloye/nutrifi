// Paystack checkout for paid interventions.
// Env: PAYSTACK_SECRET_KEY (sk_test_… / sk_live_…) and SITE_URL (already set for Convex Auth).
// PAYMENTS_DEMO=true simulates a successful payment instead (for testing only; never in production).
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";

const PAYSTACK = "https://api.paystack.co";

function reference() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return `nf_${[...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export const startPayment = action({
  args: { enrolmentId: v.id("enrolments") },
  handler: async (ctx, { enrolmentId }): Promise<{ url?: string; demo?: boolean }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Please sign in.");
    const info = await ctx.runQuery(internal.interventions.paymentInfo, { enrolmentId, userId });
    if (info.status !== "pending_payment") throw new ConvexError("This programme is already paid for.");
    const ref = reference();
    await ctx.runMutation(internal.interventions.setPaymentRef, { enrolmentId, reference: ref });

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      if (process.env.PAYMENTS_DEMO === "true") {
        await ctx.runMutation(internal.interventions.markPaid, { reference: ref, amountKobo: info.priceNaira * 100, demo: true });
        return { demo: true };
      }
      throw new ConvexError("Payments aren't switched on yet. Please check back soon.");
    }
    if (!info.email) throw new ConvexError("Your account needs an email address to pay.");
    const res = await fetch(`${PAYSTACK}/transaction/initialize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: info.email,
        amount: String(info.priceNaira * 100),
        currency: "NGN",
        reference: ref,
        callback_url: `${(process.env.SITE_URL ?? "").replace(/\/$/, "")}/programmes/paid`,
        metadata: { enrolmentId, programmeId: info.programmeId },
      }),
    });
    const body = (await res.json()) as { status: boolean; message?: string; data?: { authorization_url: string } };
    if (!res.ok || !body.status || !body.data) {
      console.error("paystack initialize failed", res.status, body.message);
      throw new ConvexError("We couldn't start the payment. Please try again.");
    }
    return { url: body.data.authorization_url };
  },
});

/** Called when Paystack sends the member back to the app. The webhook does the same thing in the background. */
export const verifyPayment = action({
  args: { reference: v.string() },
  handler: async (ctx, { reference: ref }): Promise<"activated" | "already_active" | "unknown" | "amount_mismatch" | "not_paid"> => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new ConvexError("Payments aren't switched on yet.");
    if (!/^nf_[0-9a-f]{24}$/.test(ref)) return "unknown";
    const res = await fetch(`${PAYSTACK}/transaction/verify/${encodeURIComponent(ref)}`, { headers: { Authorization: `Bearer ${secret}` } });
    const body = (await res.json()) as { data?: { status: string; amount: number; currency: string } };
    if (!res.ok || body.data?.status !== "success" || body.data.currency !== "NGN") return "not_paid";
    return ctx.runMutation(internal.interventions.markPaid, { reference: ref, amountKobo: body.data.amount });
  },
});
