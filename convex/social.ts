// Member-to-member messages: chat with another Nutrintel member and send them a week of your meal plan.
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { checkRange, checkText, getProfile, requireUser } from "./helpers";
import { sharedPlan } from "./validators";

type Ctx = QueryCtx | MutationCtx;

const MAX_PLAN_ITEMS = 28;
/** At most this many messages a minute from one person in one chat. */
const MAX_PER_MINUTE = 20;
const THREAD_LIMIT = 200;
const NOT_FOUND = "We couldn't find a Nutrintel member with that email. Check the spelling, or invite them to join.";

const otherOf = (c: Doc<"conversations">, userId: Id<"users">) => (c.a === userId ? c.b : c.a);
const readKey = (c: Doc<"conversations">, userId: Id<"users">) => (c.a === userId ? "aReadAt" : "bReadAt") as "aReadAt" | "bReadAt";
const nameOf = async (ctx: Ctx, userId: Id<"users">) => (await getProfile(ctx, userId))?.name ?? "Nutrintel member";

/** Load a conversation the signed-in user is part of. */
async function conversationFor(ctx: Ctx, id: Id<"conversations">, userId: Id<"users">) {
  const normalized = ctx.db.normalizeId("conversations", id);
  const c = normalized && (await ctx.db.get(normalized));
  if (!c || (c.a !== userId && c.b !== userId)) throw new ConvexError("Not found.");
  return c;
}

async function unreadIn(ctx: Ctx, c: Doc<"conversations">, userId: Id<"users">) {
  const since = c[readKey(c, userId)];
  const rows = await ctx.db
    .query("directMessages")
    .withIndex("by_conversation", (q) => q.eq("conversationId", c._id).gt("sentAt", since))
    .collect();
  return rows.filter((m) => m.senderId !== userId).length;
}

/** Your chats, newest first, with the other person's name, the last message and how many you haven't read. */
export const inbox = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const [asA, asB] = await Promise.all([
      ctx.db.query("conversations").withIndex("by_a", (q) => q.eq("a", userId)).collect(),
      ctx.db.query("conversations").withIndex("by_b", (q) => q.eq("b", userId)).collect(),
    ]);
    const rows = [...asA, ...asB].sort((x, y) => y.lastMessageAt - x.lastMessageAt);
    return Promise.all(
      rows.map(async (c) => {
        const last = await ctx.db.query("directMessages").withIndex("by_conversation", (q) => q.eq("conversationId", c._id)).order("desc").first();
        return {
          id: c._id,
          name: await nameOf(ctx, otherOf(c, userId)),
          lastText: last ? (last.plan && !last.text ? `📅 ${last.plan.title}` : last.text) : "",
          lastFromMe: last?.senderId === userId,
          lastAt: new Date(c.lastMessageAt).toISOString(),
          unread: await unreadIn(ctx, c, userId),
          blocked: !!c.blockedBy,
          blockedByMe: c.blockedBy === userId,
        };
      }),
    );
  },
});

/** One chat's messages (the latest 200), oldest first. */
export const thread = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const userId = await requireUser(ctx);
    const c = await conversationFor(ctx, conversationId, userId);
    const rows = await ctx.db
      .query("directMessages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", c._id))
      .order("desc")
      .take(THREAD_LIMIT);
    return {
      id: c._id,
      name: await nameOf(ctx, otherOf(c, userId)),
      blocked: !!c.blockedBy,
      blockedByMe: c.blockedBy === userId,
      messages: rows.reverse().map((m) => ({
        id: m._id,
        fromMe: m.senderId === userId,
        text: m.text,
        plan: m.plan ?? null,
        sentAt: new Date(m.sentAt).toISOString(),
      })),
    };
  },
});

/** Opens (or finds) a chat with the member who signed up with `email`. */
export const start = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const userId = await requireUser(ctx);
    if (!(await getProfile(ctx, userId))) throw new ConvexError("Finish setting up your profile first.");
    const clean = email.trim().toLowerCase();
    checkText(clean, 254, "Email");
    const other = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", clean)).first();
    if (other?._id === userId) throw new ConvexError("That's your own email. Enter a friend's email instead.");
    if (!other || !(await getProfile(ctx, other._id))) throw new ConvexError(NOT_FOUND);
    const [a, b] = userId < other._id ? [userId, other._id] : [other._id, userId];
    const existing = await ctx.db.query("conversations").withIndex("by_pair", (q) => q.eq("a", a).eq("b", b)).unique();
    if (existing) return existing._id;
    // Nothing read yet, so a message sent in the same millisecond still counts as unread.
    return ctx.db.insert("conversations", { a, b, lastMessageAt: Date.now(), aReadAt: 0, bReadAt: 0 });
  },
});

export const send = mutation({
  args: { conversationId: v.id("conversations"), text: v.string(), plan: v.optional(sharedPlan) },
  handler: async (ctx, { conversationId, text, plan }) => {
    const userId = await requireUser(ctx);
    const c = await conversationFor(ctx, conversationId, userId);
    if (c.blockedBy) throw new ConvexError("You can't send messages in this chat.");
    const clean = text.trim();
    checkText(clean, 2000, "Message");
    if (plan) {
      checkText(plan.title, 80, "Plan title");
      if (plan.items.length === 0 || plan.items.length > MAX_PLAN_ITEMS) throw new ConvexError("A shared plan has 1 to 28 meals.");
      for (const it of plan.items) {
        if (!Number.isInteger(it.day)) throw new ConvexError("Invalid plan day.");
        checkRange(it.day, 0, 6, "Plan day");
        checkText(it.recipeId, 60, "Recipe");
        if (it.portion !== undefined) checkRange(it.portion, 0.25, 4, "Portion");
      }
    }
    if (!clean && !plan) return;
    const now = Date.now();
    const recent = await ctx.db
      .query("directMessages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", c._id).gt("sentAt", now - 60_000))
      .collect();
    if (recent.filter((m) => m.senderId === userId).length >= MAX_PER_MINUTE) throw new ConvexError("You're sending messages very fast. Please wait a minute.");
    await ctx.db.insert("directMessages", { conversationId: c._id, senderId: userId, text: clean, plan, sentAt: now });
    await ctx.db.patch(c._id, { lastMessageAt: now, [readKey(c, userId)]: now });
  },
});

export const markRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const userId = await requireUser(ctx);
    const c = await conversationFor(ctx, conversationId, userId);
    await ctx.db.patch(c._id, { [readKey(c, userId)]: Date.now() });
  },
});

/** Block stops messages both ways; only the person who blocked can unblock. */
export const setBlocked = mutation({
  args: { conversationId: v.id("conversations"), blocked: v.boolean() },
  handler: async (ctx, { conversationId, blocked }) => {
    const userId = await requireUser(ctx);
    const c = await conversationFor(ctx, conversationId, userId);
    if (blocked && !c.blockedBy) await ctx.db.patch(c._id, { blockedBy: userId });
    if (!blocked && c.blockedBy === userId) await ctx.db.patch(c._id, { blockedBy: undefined });
  },
});

/** Removes every chat the user is in, with all its messages (used when they delete their data). */
export async function deleteConversationsOf(ctx: MutationCtx, userId: Id<"users">) {
  const [asA, asB] = await Promise.all([
    ctx.db.query("conversations").withIndex("by_a", (q) => q.eq("a", userId)).collect(),
    ctx.db.query("conversations").withIndex("by_b", (q) => q.eq("b", userId)).collect(),
  ]);
  for (const c of [...asA, ...asB]) {
    for (const m of await ctx.db.query("directMessages").withIndex("by_conversation", (q) => q.eq("conversationId", c._id)).collect()) {
      await ctx.db.delete(m._id);
    }
    await ctx.db.delete(c._id);
  }
}
