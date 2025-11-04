import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    plan: v.string(), // "starter" | "creator" | "studio"
    credits: v.number(),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  jobs: defineTable({
    userId: v.id("users"),
    prompt: v.string(),
    imageUrl: v.optional(v.string()),
    durationSec: v.number(), // 5, 10, or 15
    creditsUsed: v.number(),
    r2Url: v.optional(v.string()),
    status: v.string(), // "queued" | "running" | "done" | "failed"
    runpodJobId: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    seed: v.optional(v.number()),
    cfg: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId", "createdAt"])
    .index("by_status", ["status", "createdAt"])
    .index("by_runpodJobId", ["runpodJobId"]),

  plans: defineTable({
    name: v.string(),
    monthlyCredits: v.number(),
    price: v.number(), // USD cents
    markup: v.number(), // percentage
    features: v.array(v.string()),
    isActive: v.boolean(),
  }).index("by_name", ["name"]),

  payments: defineTable({
    userId: v.id("users"),
    trueLayerTxnId: v.string(),
    amount: v.number(), // USD cents
    creditsAdded: v.number(),
    status: v.string(), // "pending" | "completed" | "failed"
    timestamp: v.number(),
  })
    .index("by_userId", ["userId", "timestamp"])
    .index("by_trueLayerTxnId", ["trueLayerTxnId"]),

  creditLedger: defineTable({
    userId: v.id("users"),
    jobId: v.optional(v.id("jobs")),
    paymentId: v.optional(v.id("payments")),
    amount: v.number(), // positive for additions, negative for deductions
    balanceAfter: v.number(),
    type: v.string(), // "subscription" | "purchase" | "generation" | "refund"
    description: v.string(),
    timestamp: v.number(),
  })
    .index("by_userId", ["userId", "timestamp"])
    .index("by_jobId", ["jobId"]),
});
