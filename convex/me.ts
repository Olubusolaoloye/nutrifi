import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { getProfile, isAdmin } from "./helpers";

/**
 * Everything the app needs for the signed-in user, in one reactive query.
 * Returns null when signed out. (Fine at MVP scale; paginate the diary later.)
 */
export const snapshot = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    const [profile, diary, water, weights, events, exercises, notes, plan, grocery, verifications, settings] = await Promise.all([
      getProfile(ctx, userId),
      ctx.db.query("diary").withIndex("by_user_date", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("water").withIndex("by_user_date", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("weights").withIndex("by_user_date", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("events").withIndex("by_user_date", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("exercises").withIndex("by_user_date", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("notes").withIndex("by_user_date_slot", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("plan").withIndex("by_user_date_meal", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("grocery").withIndex("by_user", (q) => q.eq("userId", userId)).unique(),
      ctx.db.query("verifications").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("settings").withIndex("by_user", (q) => q.eq("userId", userId)).unique(),
    ]);
    const latest = verifications.sort((a, b) => b.submittedAt - a.submittedAt)[0] ?? null;

    return {
      email: user?.email ?? null,
      isAdmin: await isAdmin(ctx, userId),
      profile,
      verification: latest && { status: latest.status, credential: latest.credential, reviewerNote: latest.reviewerNote ?? null, hasDocument: !!latest.documentId },
      diary,
      water,
      weights,
      events,
      exercises,
      notes,
      plan,
      grocery,
      planPrefs: settings?.planPrefs ?? null,
      reminders: settings?.reminders ?? null,
    };
  },
});
