import { ConvexError } from "convex/values";
import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { requireUser } from "./helpers";
import { planPrefs, reminderSettings } from "./validators";
import { validateReminders } from "../src/lib/reminders";

async function upsert(ctx: MutationCtx, userId: Id<"users">, patch: Record<string, unknown>) {
  const row = await ctx.db.query("settings").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
  if (row) await ctx.db.patch(row._id, patch);
  else await ctx.db.insert("settings", { userId, ...patch });
}

export const updatePlanPrefs = mutation({
  args: { prefs: planPrefs },
  handler: async (ctx, { prefs }) => {
    const userId = await requireUser(ctx);
    if (prefs.budgetPerDay !== null && !(prefs.budgetPerDay >= 500 && prefs.budgetPerDay <= 200_000)) {
      throw new ConvexError("Daily budget must be between ₦500 and ₦200,000.");
    }
    await upsert(ctx, userId, { planPrefs: prefs });
  },
});

export const updateReminders = mutation({
  args: { reminders: reminderSettings },
  handler: async (ctx, { reminders }) => {
    const userId = await requireUser(ctx);
    const errors = validateReminders(reminders);
    if (errors.length) throw new ConvexError(errors[0]);
    await upsert(ctx, userId, { reminders });
  },
});
