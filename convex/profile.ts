import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { checkDate, checkRange, checkText, getProfile, requireUser } from "./helpers";
import { profileFields, role } from "./validators";

function checkProfile(p: { name?: string; birthDate?: string; heightCm?: number }) {
  if (p.name !== undefined) checkText(p.name, 60, "Name");
  if (p.birthDate !== undefined) checkDate(p.birthDate);
  if (p.heightCm !== undefined) checkRange(p.heightCm, 50, 250, "Height (cm)");
}

/** Create the profile at the end of onboarding, with the first weight. */
export const create = mutation({
  args: { ...profileFields, role, weightKg: v.number(), credential: v.optional(v.string()) },
  handler: async (ctx, { weightKg, credential, ...p }) => {
    const userId = await requireUser(ctx);
    if (await getProfile(ctx, userId)) throw new ConvexError("Your profile already exists.");
    checkProfile(p);
    checkRange(weightKg, 20, 350, "Weight (kg)");
    const isPro = p.role !== "consumer";
    const now = Date.now();
    await ctx.db.insert("profiles", { ...p, userId, verification: isPro && credential ? "pending" : "none", createdAt: now });
    await ctx.db.insert("weights", { userId, date: new Date(now).toISOString().slice(0, 10), weightKg });
    if (isPro && credential) {
      checkText(credential, 120, "Credential");
      await ctx.db.insert("verifications", {
        userId,
        role: p.role as "student" | "dietitian",
        credential: credential.trim(),
        status: "pending",
        submittedAt: now,
      });
    }
  },
});

/** Members can edit their own details. Role and verification can't be changed here. */
export const update = mutation({
  args: {
    name: v.optional(profileFields.name),
    sex: v.optional(profileFields.sex),
    birthDate: v.optional(profileFields.birthDate),
    heightCm: v.optional(profileFields.heightCm),
    activity: v.optional(profileFields.activity),
    goal: v.optional(profileFields.goal),
    conditions: v.optional(profileFields.conditions),
  },
  handler: async (ctx, patch) => {
    const userId = await requireUser(ctx);
    const profile = await getProfile(ctx, userId);
    if (!profile) throw new ConvexError("Finish setting up your profile first.");
    checkProfile(patch);
    await ctx.db.patch(profile._id, patch);
  },
});
