import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";

const http = httpRouter();
auth.addHttpRoutes(http);

async function hmacSha512Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time comparison of two hex strings. */
function sameHex(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Paystack webhook (set https://<deployment>.convex.site/paystack/webhook in the Paystack dashboard). */
http.route({
  path: "/paystack/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return new Response("Payments not configured", { status: 503 });
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature") ?? "";
    if (!sameHex(await hmacSha512Hex(secret, body), signature.toLowerCase())) return new Response("Bad signature", { status: 401 });
    const event = JSON.parse(body) as { event: string; data?: { reference?: string; amount?: number; currency?: string; status?: string } };
    if (event.event === "charge.success" && event.data?.reference && event.data.currency === "NGN" && typeof event.data.amount === "number") {
      await ctx.runMutation(internal.interventions.markPaid, { reference: event.data.reference, amountKobo: event.data.amount });
    }
    return new Response("ok", { status: 200 });
  }),
});

export default http;
