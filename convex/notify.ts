"use node";
// Sends reminders: web push (VAPID) and WhatsApp (Meta WhatsApp Cloud API template messages).
import { v } from "convex/values";
import webpush from "web-push";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import type { Delivery } from "./reminders";

const GRAPH = "https://graph.facebook.com/v21.0";

function pushReady(): boolean {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:hello@nutrifi.ng", pub, priv);
  return true;
}

/** Returns the endpoints that no longer exist. */
async function sendPush(d: Delivery): Promise<string[]> {
  if (d.push.length === 0 || !pushReady()) return [];
  const gone: string[] = [];
  for (const m of d.messages) {
    const payload = JSON.stringify({ title: m.title, body: m.body, url: m.url, tag: m.key });
    await Promise.all(
      d.push.map(async (s) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3600, urgency: "normal" });
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) gone.push(s.endpoint);
          else console.error("push failed", status, (err as Error).message);
        }
      }),
    );
  }
  return [...new Set(gone)];
}

/** WhatsApp business-initiated messages must use an approved template. */
async function sendTemplate(to: string, template: string, components: unknown[]) {
  const res = await fetch(`${GRAPH}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace(/^\+/, ""),
      type: "template",
      template: { name: template, language: { code: process.env.WHATSAPP_TEMPLATE_LANG ?? "en" }, components },
    }),
  });
  if (!res.ok) console.error("whatsapp failed", res.status, await res.text());
}

/** The reminder template has two body variables: {{1}} first name, {{2}} the reminder text. */
const reminderTemplate = (name: string, text: string) => [
  { type: "body", parameters: [{ type: "text", text: name }, { type: "text", text: text.slice(0, 900) }] },
];

async function sendWhatsApp(d: Delivery) {
  if (!d.whatsapp || !process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) return;
  const template = process.env.WHATSAPP_TEMPLATE ?? "nutrifi_reminder";
  // One message per run, even when several reminders fall due together.
  const text = d.messages.map((m) => `${m.title} ${m.body}`).join(" · ");
  await sendTemplate(d.whatsapp, template, reminderTemplate(d.name, text));
}

export const deliver = internalAction({
  args: { deliveries: v.any() },
  handler: async (ctx, { deliveries }) => {
    const gone: string[] = [];
    for (const d of deliveries as Delivery[]) {
      const [expired] = await Promise.all([sendPush(d), sendWhatsApp(d)]);
      gone.push(...expired);
    }
    if (gone.length) await ctx.runMutation(internal.reminders.removeEndpoints, { endpoints: gone });
  },
});

/** Runs every 5 minutes (see crons.ts). */
export const tick = internalAction({
  args: {},
  handler: async (ctx) => {
    const deliveries: Delivery[] = await ctx.runMutation(internal.reminders.claimDue, { now: Date.now() });
    if (deliveries.length) await ctx.runAction(internal.notify.deliver, { deliveries });
  },
});

export const sendWhatsAppCode = internalAction({
  args: { phone: v.string(), code: v.string() },
  handler: async (_ctx, { phone, code }) => {
    const authTemplate = process.env.WHATSAPP_CODE_TEMPLATE;
    if (authTemplate) {
      // Meta "authentication" template: the code goes in the body and the copy-code button.
      await sendTemplate(phone, authTemplate, [
        { type: "body", parameters: [{ type: "text", text: code }] },
        { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] },
      ]);
    } else {
      await sendTemplate(phone, process.env.WHATSAPP_TEMPLATE ?? "nutrifi_reminder", reminderTemplate("there", `your Nutrifi code is ${code}. Enter it in the app to switch on WhatsApp reminders.`));
    }
  },
});
