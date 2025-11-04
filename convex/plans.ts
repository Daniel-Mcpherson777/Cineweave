import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Seed initial plans (run once on first deploy)
export const seedPlans = mutation({
  handler: async (ctx) => {
    // Check if plans already exist
    const existingPlans = await ctx.db.query("plans").collect();
    if (existingPlans.length > 0) {
      return { message: "Plans already seeded" };
    }

    // Starter plan
    await ctx.db.insert("plans", {
      name: "starter",
      monthlyCredits: 80,
      price: 1000, // $10.00
      markup: 85,
      features: [
        "80 credits/month",
        "~6-7 minutes of video",
        "720p @ 24fps",
        "24-hour video access",
        "Email support",
      ],
      isActive: true,
    });

    // Creator plan
    await ctx.db.insert("plans", {
      name: "creator",
      monthlyCredits: 250,
      price: 3100, // $31.00
      markup: 75,
      features: [
        "250 credits/month",
        "~20 minutes of video",
        "720p @ 24fps",
        "24-hour video access",
        "Priority queue",
        "Email support",
      ],
      isActive: true,
    });

    // Studio plan
    await ctx.db.insert("plans", {
      name: "studio",
      monthlyCredits: 500,
      price: 6000, // $60.00
      markup: 70,
      features: [
        "500 credits/month",
        "~40 minutes of video",
        "720p @ 24fps",
        "24-hour video access",
        "Priority queue",
        "Dedicated support",
        "API access (coming soon)",
      ],
      isActive: true,
    });

    return { message: "Plans seeded successfully" };
  },
});

// Get all active plans
export const listPlans = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("plans")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get plan by name
export const getPlan = query({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("plans")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});
