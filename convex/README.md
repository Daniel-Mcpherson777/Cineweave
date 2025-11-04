# CineWeave Convex Backend

Convex database schema and server functions for CineWeave.

## Overview

Convex handles:
- User data and credit balances
- Video generation job tracking
- Subscription plans
- Payment history
- Real-time updates to frontend

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Initialize Convex**
   ```bash
   npx convex dev
   ```

   This will:
   - Create a new Convex project (first time)
   - Generate TypeScript types
   - Start local development server
   - Watch for file changes

3. **Deploy to production**
   ```bash
   npx convex deploy
   ```

## Project Structure

```
convex/
├── schema.ts           # Database table schemas
├── users.ts            # User operations
├── credits.ts          # Credit management functions
├── jobs.ts             # Job CRUD operations
├── plans.ts            # Subscription plan data
├── payments.ts         # Payment tracking
└── _generated/         # Auto-generated TypeScript types
```

## Data Model

### users
```typescript
{
  clerkId: string,        // Clerk user ID
  email: string,
  plan: string,           // "starter" | "creator" | "studio"
  credits: number,        // Current credit balance
  createdAt: number,      // Timestamp
}
```

### jobs
```typescript
{
  userId: Id<"users">,
  prompt: string,
  imageUrl?: string,
  durationSec: number,    // 5, 10, or 15
  creditsUsed: number,
  r2Url?: string,         // Video URL after generation
  status: string,         // "queued" | "running" | "done" | "failed"
  expiresAt?: number,     // Timestamp (now + 24h)
  seed?: number,
  cfg?: number,
  createdAt: number,
}
```

### plans
```typescript
{
  name: string,           // "starter" | "creator" | "studio"
  monthlyCredits: number, // 80, 250, 500
  price: number,          // USD cents: 1000, 3100, 6000
  markup: number,         // 85, 75, 70 (percent)
}
```

### payments
```typescript
{
  userId: Id<"users">,
  trueLayerTxnId: string,
  amount: number,         // USD cents
  creditsAdded: number,
  timestamp: number,
}
```

## Key Functions

### Credit Management

**reserveCredits(userId, credits)**
- Checks user balance
- Deducts credits atomically
- Returns success/failure
- Creates ledger entry

**settleCredits(jobId)**
- Called when job completes
- Finalizes credit usage
- Updates job metadata

**refundCredits(jobId)**
- Called when job fails
- Returns credits to user
- Updates job status to failed

**getCredits(userId)**
- Returns current credit balance
- Includes plan information

### Job Operations

**createJob(userId, prompt, imageUrl?, durationSec, seed?)**
- Validates input
- Reserves credits
- Creates job record with status "queued"
- Returns job ID

**updateJobStatus(jobId, status, r2Url?, expiresAt?)**
- Updates job status
- Sets video URL when complete
- Sets expiration timestamp (now + 24h)

**getJob(jobId)**
- Returns job details
- Includes video URL and status

**listUserJobs(userId, limit?)**
- Returns user's recent jobs
- Ordered by creation date
- Paginated

**expireOldJobs()**
- Cron function (runs hourly)
- Marks expired jobs
- Cleanup metadata

### User Operations

**getOrCreateUser(clerkId, email)**
- Creates user if doesn't exist
- Returns user record
- Sets default plan and credits

**updateUserPlan(userId, planName)**
- Changes subscription plan
- Updates credit allocation
- Records plan change

### Plan Operations

**listPlans()**
- Returns all available plans
- Includes pricing and credit info

**getPlan(name)**
- Returns specific plan details

## Real-time Subscriptions

Frontend can subscribe to:

**Job updates:**
```typescript
const job = useQuery(api.jobs.getJob, { jobId: "..." });
```

**Credit balance:**
```typescript
const credits = useQuery(api.credits.getCredits, { userId: "..." });
```

**User jobs list:**
```typescript
const jobs = useQuery(api.jobs.listUserJobs, { userId: "..." });
```

## Mutations vs Queries

**Queries** (read-only):
- `getJob`
- `listUserJobs`
- `getCredits`
- `listPlans`

**Mutations** (write operations):
- `createJob`
- `updateJobStatus`
- `reserveCredits`
- `refundCredits`
- `updateUserPlan`

## Environment Variables

Set in Convex dashboard:
- No additional env vars needed for basic operations
- API keys for external services (if needed)

## Indexes

Create these indexes for performance:

**users table:**
- `by_clerkId`: `(clerkId)`

**jobs table:**
- `by_userId`: `(userId, createdAt)`
- `by_status`: `(status, createdAt)`

**payments table:**
- `by_userId`: `(userId, timestamp)`

## Seed Data

Seed plans on first deploy:

```typescript
// In convex/plans.ts
export const seedPlans = mutation({
  handler: async (ctx) => {
    await ctx.db.insert("plans", {
      name: "starter",
      monthlyCredits: 80,
      price: 1000,  // $10.00
      markup: 85,
    });
    // ... creator and studio plans
  }
});
```

## Testing

Run locally with `npx convex dev` and test functions:

```bash
# In Convex dashboard or via client
npx convex run users:getOrCreateUser --arg '{"clerkId": "user_123", "email": "test@example.com"}'
```

## Deployment

1. **Development**: `npx convex dev`
2. **Production**: `npx convex deploy`

Set production URL in frontend:
```
NEXT_PUBLIC_CONVEX_URL=https://xxxxx.convex.cloud
```

## Monitoring

Track these metrics:
- Credit consumption rate
- Job success/failure ratio
- Average job duration
- Active users per plan
- Payment processing success rate

## Best Practices

- Use transactions for credit operations
- Validate all inputs in mutations
- Use indexes for common queries
- Keep functions small and focused
- Handle edge cases (negative credits, duplicate jobs)
- Log important events for debugging
