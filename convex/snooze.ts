// Snooze links for alarm reminders. The notification carries a signed token; tapping "Snooze" posts it to
// /reminders/snooze (http.ts), which sends the same reminder again 10 minutes later. Signed with HMAC-SHA256
// (key: VAPID_PRIVATE_KEY, which only the server has), so a token can't be forged or edited, and it expires.
import type { ReminderMessage } from "../src/lib/reminders";

export const MAX_SNOOZES = 3;
export const SNOOZE_MS = 10 * 60_000;
const TOKEN_TTL_MS = 12 * 3600_000;

export interface SnoozePayload {
  /** User id. */
  u: string;
  m: Pick<ReminderMessage, "key" | "title" | "body" | "url">;
  /** Times already snoozed. */
  n: number;
  /** Expires at (ms). */
  e: number;
}

const b64url = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));

async function hmacHex(secret: string, data: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function signSnooze(secret: string, p: Omit<SnoozePayload, "e">, now = Date.now()) {
  const body = b64url(JSON.stringify({ ...p, e: now + TOKEN_TTL_MS }));
  return `${body}.${await hmacHex(secret, body)}`;
}

export async function readSnooze(secret: string, token: string, now = Date.now()): Promise<SnoozePayload | null> {
  const [body, sig] = token.split(".");
  if (!body || !sig || sig.length !== 64) return null;
  const expected = await hmacHex(secret, body);
  let diff = 0;
  for (let i = 0; i < 64; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  if (diff !== 0) return null;
  try {
    const p = JSON.parse(fromB64url(body)) as SnoozePayload;
    return p.e > now && p.n < MAX_SNOOZES ? p : null;
  } catch {
    return null;
  }
}
