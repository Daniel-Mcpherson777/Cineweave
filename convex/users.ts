import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get or create user from Clerk ID
export const getOrCreateUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      return existing;
    }

    // Create new user with starter plan (80 credits)
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      plan: "starter",
      credits: 80,
      createdAt: Date.now(),
    });

    // Create initial credit ledger entry
    await ctx.db.insert("creditLedger", {
      userId,
      amount: 80,
      balanceAfter: 80,
      type: "subscription",
      description: "Welcome credits - Starter plan",
      timestamp: Date.now(),
    });

    return await ctx.db.get(userId);
  },
});

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Get user by ID
export const getUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Update user plan
export const updateUserPlan = mutation({
  args: {
    userId: v.id("users"),
    planName: v.string(),
    creditsToAdd: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const newCredits = user.credits + args.creditsToAdd;

    await ctx.db.patch(args.userId, {
      plan: args.planName,
      credits: newCredits,
    });

    // Log credit addition
    if (args.creditsToAdd > 0) {
      await ctx.db.insert("creditLedger", {
        userId: args.userId,
        amount: args.creditsToAdd,
        balanceAfter: newCredits,
        type: "subscription",
        description: `Plan changed to ${args.planName}`,
        timestamp: Date.now(),
      });
    }

    return await ctx.db.get(args.userId);
  },
});
