import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Public: join the launch waitlist from the landing page. Idempotent per email. */
export const join = mutation({
  args: { email: v.string(), role: v.union(v.literal("member"), v.literal("student"), v.literal("dietitian")) },
  handler: async (ctx, { email, role }) => {
    const clean = email.trim().toLowerCase();
    if (clean.length > 254 || !EMAIL.test(clean)) throw new ConvexError("Please enter a valid email address.");
    const existing = await ctx.db.query("waitlist").withIndex("by_email", (q) => q.eq("email", clean)).unique();
    if (existing) return { alreadyJoined: true };
    await ctx.db.insert("waitlist", { email: clean, role, createdAt: Date.now() });
    return { alreadyJoined: false };
  },
});
