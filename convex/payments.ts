import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create payment record
export const createPayment = mutation({
  args: {
    userId: v.id("users"),
    trueLayerTxnId: v.string(),
    amount: v.number(),
    creditsAdded: v.number(),
  },
  handler: async (ctx, args) => {
    const paymentId = await ctx.db.insert("payments", {
      userId: args.userId,
      trueLayerTxnId: args.trueLayerTxnId,
      amount: args.amount,
      creditsAdded: args.creditsAdded,
      status: "pending",
      timestamp: Date.now(),
    });

    return paymentId;
  },
});

// Update payment status
export const updatePaymentStatus = mutation({
  args: {
    paymentId: v.id("payments"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.paymentId, {
      status: args.status,
    });

    return await ctx.db.get(args.paymentId);
  },
});

// Get payment by TrueLayer transaction ID
export const getPaymentByTrueLayerId = query({
  args: {
    trueLayerTxnId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_trueLayerTxnId", (q) =>
        q.eq("trueLayerTxnId", args.trueLayerTxnId)
      )
      .first();
  },
});

// List user's payment history
export const listUserPayments = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    return await ctx.db
      .query("payments")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});
