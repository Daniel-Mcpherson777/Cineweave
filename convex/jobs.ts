import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new job
export const createJob = mutation({
  args: {
    userId: v.id("users"),
    prompt: v.string(),
    imageUrl: v.optional(v.string()),
    durationSec: v.number(),
    seed: v.optional(v.number()),
    cfg: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Validate duration
    if (![5, 10, 15].includes(args.durationSec)) {
      throw new Error("Duration must be 5, 10, or 15 seconds");
    }

    // Calculate credits needed (1 credit per 5 seconds)
    const creditsNeeded = args.durationSec / 5;

    // Check user has enough credits
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.credits < creditsNeeded) {
      throw new Error("Insufficient credits");
    }

    // Create job record
    const jobId = await ctx.db.insert("jobs", {
      userId: args.userId,
      prompt: args.prompt,
      imageUrl: args.imageUrl,
      durationSec: args.durationSec,
      creditsUsed: creditsNeeded,
      status: "queued",
      seed: args.seed,
      cfg: args.cfg || 7.5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return jobId;
  },
});

// Update job status
export const updateJobStatus = mutation({
  args: {
    jobId: v.id("jobs"),
    status: v.string(),
    runpodJobId: v.optional(v.string()),
    r2Url: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    const updates: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.runpodJobId) {
      updates.runpodJobId = args.runpodJobId;
    }

    if (args.r2Url) {
      updates.r2Url = args.r2Url;
    }

    if (args.errorMessage) {
      updates.errorMessage = args.errorMessage;
    }

    // Set expiration for completed jobs (24 hours)
    if (args.status === "done") {
      updates.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    }

    await ctx.db.patch(args.jobId, updates);

    return await ctx.db.get(args.jobId);
  },
});

// Get job by ID
export const getJob = query({
  args: {
    jobId: v.id("jobs"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

// Get job by RunPod job ID
export const getJobByRunpodId = query({
  args: {
    runpodJobId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobs")
      .withIndex("by_runpodJobId", (q) => q.eq("runpodJobId", args.runpodJobId))
      .first();
  },
});

// List user's jobs
export const listUserJobs = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    return jobs;
  },
});

// Get recent jobs (for dashboard)
export const getRecentJobs = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;

    return await ctx.db
      .query("jobs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

// Count active jobs for rate limiting
export const countActiveJobs = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const activeJobs = jobs.filter(
      (job) => job.status === "queued" || job.status === "running"
    );

    return activeJobs.length;
  },
});
