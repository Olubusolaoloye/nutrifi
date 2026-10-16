import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  diaryFields,
  eventFields,
  exerciseFields,
  isoDate,
  meal,
  noteFields,
  noteSlot,
  profileFields,
  role,
  verification,
} from "./validators";

export default defineSchema({
  // users, sessions, accounts… managed by Convex Auth.
  ...authTables,

  profiles: defineTable({
    userId: v.id("users"),
    ...profileFields,
    role,
    /** Only changed by the server: on submission (pending) and by admins (verified/rejected). */
    verification,
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  verifications: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("student"), v.literal("dietitian")),
    credential: v.string(),
    documentId: v.optional(v.id("_storage")),
    status: v.union(v.literal("pending"), v.literal("verified"), v.literal("rejected")),
    submittedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewerNote: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  diary: defineTable({ userId: v.id("users"), ...diaryFields }).index("by_user_date", ["userId", "date"]),

  water: defineTable({ userId: v.id("users"), date: isoDate, ml: v.number() }).index("by_user_date", ["userId", "date"]),

  weights: defineTable({ userId: v.id("users"), date: isoDate, weightKg: v.number() }).index("by_user_date", ["userId", "date"]),

  notes: defineTable({ userId: v.id("users"), date: isoDate, slot: noteSlot, ...noteFields, updatedAt: v.string() }).index(
    "by_user_date_slot",
    ["userId", "date", "slot"],
  ),

  plan: defineTable({ userId: v.id("users"), date: isoDate, meal, recipeId: v.string() }).index("by_user_date_meal", [
    "userId",
    "date",
    "meal",
  ]),

  grocery: defineTable({
    userId: v.id("users"),
    people: v.number(),
    purchased: v.record(v.string(), v.boolean()),
    qtyOverride: v.record(v.string(), v.number()),
  }).index("by_user", ["userId"]),

  events: defineTable({ userId: v.id("users"), ...eventFields }).index("by_user_date", ["userId", "date"]),

  exercises: defineTable({ userId: v.id("users"), ...exerciseFields }).index("by_user_date", ["userId", "date"]),

  waitlist: defineTable({
    email: v.string(),
    role: v.union(v.literal("member"), v.literal("student"), v.literal("dietitian")),
    createdAt: v.number(),
  }).index("by_email", ["email"]),
});
