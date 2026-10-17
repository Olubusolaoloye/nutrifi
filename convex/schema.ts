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
  planPrefs,
  profileFields,
  reminderSettings,
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

  plan: defineTable({ userId: v.id("users"), date: isoDate, meal, recipeId: v.string(), portion: v.optional(v.number()) }).index("by_user_date_meal", [
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

  /** Per-user preferences: meal-plan preferences and reminder settings. */
  settings: defineTable({
    userId: v.id("users"),
    planPrefs: v.optional(planPrefs),
    reminders: v.optional(reminderSettings),
  }).index("by_user", ["userId"]),

  /** Web push subscriptions, one per device/browser. */
  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"]),

  /** WhatsApp number for reminders. Only used once the member has confirmed it with a code. */
  whatsapp: defineTable({
    userId: v.id("users"),
    phone: v.string(),
    verifiedAt: v.optional(v.number()),
    codeHash: v.optional(v.string()),
    codeExpiresAt: v.optional(v.number()),
    attempts: v.number(),
    /** When codes were sent (for rate limiting). */
    codesSentAt: v.array(v.number()),
  }).index("by_user", ["userId"]),

  /** Reminders already sent, so each one goes out once. Old rows are cleaned up by the cron. */
  reminderLog: defineTable({ userId: v.id("users"), key: v.string(), sentAt: v.number() })
    .index("by_user_key", ["userId", "key"])
    .index("by_sentAt", ["sentAt"]),

  waitlist: defineTable({
    email: v.string(),
    role: v.union(v.literal("member"), v.literal("student"), v.literal("dietitian")),
    createdAt: v.number(),
  }).index("by_email", ["email"]),
});
