import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user's current credits
export const getCredits = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const plan = await ctx.db
      .query("plans")
      .withIndex("by_name", (q) => q.eq("name", user.plan))
      .first();

    return {
      credits: user.credits,
      plan: user.plan,
      planDetails: plan,
    };
  },
});

// Reserve credits for a job (check balance and deduct)
export const reserveCredits = mutation({
  args: {
    userId: v.id("users"),
    credits: v.number(),
    jobId: v.id("jobs"),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user has enough credits
    if (user.credits < args.credits) {
      throw new Error("Insufficient credits");
    }

    // Deduct credits
    const newBalance = user.credits - args.credits;
    await ctx.db.patch(args.userId, {
      credits: newBalance,
    });

    // Create ledger entry
    await ctx.db.insert("creditLedger", {
      userId: args.userId,
      jobId: args.jobId,
      amount: -args.credits,
      balanceAfter: newBalance,
      type: "generation",
      description: args.description,
      timestamp: Date.now(),
    });

    return {
      success: true,
      creditsRemaining: newBalance,
    };
  },
});

// Refund credits when job fails
export const refundCredits = mutation({
  args: {
    userId: v.id("users"),
    credits: v.number(),
    jobId: v.id("jobs"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Add credits back
    const newBalance = user.credits + args.credits;
    await ctx.db.patch(args.userId, {
      credits: newBalance,
    });

    // Create ledger entry
    await ctx.db.insert("creditLedger", {
      userId: args.userId,
      jobId: args.jobId,
      amount: args.credits,
      balanceAfter: newBalance,
      type: "refund",
      description: `Refund: ${args.reason}`,
      timestamp: Date.now(),
    });

    return {
      success: true,
      creditsRemaining: newBalance,
    };
  },
});

// Add credits (for payments)
export const addCredits = mutation({
  args: {
    userId: v.id("users"),
    credits: v.number(),
    paymentId: v.optional(v.id("payments")),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const newBalance = user.credits + args.credits;
    await ctx.db.patch(args.userId, {
      credits: newBalance,
    });

    // Create ledger entry
    await ctx.db.insert("creditLedger", {
      userId: args.userId,
      paymentId: args.paymentId,
      amount: args.credits,
      balanceAfter: newBalance,
      type: "purchase",
      description: args.description,
      timestamp: Date.now(),
    });

    return {
      success: true,
      creditsRemaining: newBalance,
    };
  },
});

// Get credit history for user
export const getCreditHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const entries = await ctx.db
      .query("creditLedger")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    return entries;
  },
});
