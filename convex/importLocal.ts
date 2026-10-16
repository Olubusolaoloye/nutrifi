import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { checkDate, requireUser } from "./helpers";
import { diaryFields, eventFields, exerciseFields, isoDate, meal, noteFields, noteSlot } from "./validators";

/**
 * One-time import of data saved on a device before accounts existed.
 * Only allowed while the account has no logs yet, so it can't duplicate entries.
 */
export const importLocal = mutation({
  args: {
    diary: v.array(v.object(diaryFields)),
    water: v.array(v.object({ date: isoDate, ml: v.number() })),
    weights: v.array(v.object({ date: isoDate, weightKg: v.number() })),
    notes: v.array(v.object({ date: isoDate, slot: noteSlot, ...noteFields, updatedAt: v.string() })),
    plan: v.array(v.object({ date: isoDate, meal, recipeId: v.string() })),
    events: v.array(v.object(eventFields)),
    exercises: v.array(v.object(exerciseFields)),
  },
  handler: async (ctx, data) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db.query("diary").withIndex("by_user_date", (q) => q.eq("userId", userId)).first();
    if (existing) throw new ConvexError("Your account already has logs, so we didn't import to avoid duplicates.");
    const total = Object.values(data).reduce((t, arr) => t + arr.length, 0);
    if (total > 5000) throw new ConvexError("That's a lot of data — please contact support to import it.");

    for (const e of data.diary) { checkDate(e.date); await ctx.db.insert("diary", { ...e, userId }); }
    for (const w of data.water) { checkDate(w.date); await ctx.db.insert("water", { ...w, userId }); }
    const weightDates = new Set(
      (await ctx.db.query("weights").withIndex("by_user_date", (q) => q.eq("userId", userId)).collect()).map((w) => w.date),
    );
    for (const w of data.weights) if (!weightDates.has(w.date)) { checkDate(w.date); await ctx.db.insert("weights", { ...w, userId }); }
    for (const n of data.notes) { checkDate(n.date); await ctx.db.insert("notes", { ...n, userId }); }
    for (const p of data.plan) { checkDate(p.date); await ctx.db.insert("plan", { ...p, userId }); }
    for (const e of data.events) { checkDate(e.date); await ctx.db.insert("events", { ...e, userId }); }
    for (const e of data.exercises) { checkDate(e.date); await ctx.db.insert("exercises", { ...e, userId }); }
    return { imported: total };
  },
});
