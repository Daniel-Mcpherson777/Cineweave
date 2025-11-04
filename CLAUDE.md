# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CineWeave is an AI-powered video generation platform that transforms text prompts or images into cinematic videos at 720p/24fps. Built on the Wan 2.2-TI2V-5B model, it provides 5-15 second video clips through a web-based interface.

## Architecture

### System Components

```
Web App (React/Next.js) → API Gateway (Cloud Run/FastAPI) → RunPod Serverless (H100)
                ↓                      ↓                           ↓
           Clerk Auth              Convex DB                  Cloudflare R2
                                 TrueLayer Payments
```

**Frontend**: React/Next.js with Clerk authentication
**API Gateway**: FastAPI on Google Cloud Run (mediates between UI and RunPod)
**Compute**: RunPod Serverless with H100 GPUs + Network Volume
**Database**: Convex (users, jobs, credits, plans)
**Storage**: Cloudflare R2 with 24-hour auto-deletion lifecycle
**Auth**: Clerk (OAuth & session management)
**Payments**: TrueLayer (Open Banking for EU/UK)

### Repository Structure

```
/frontend   - Next.js web application
/gateway    - FastAPI API gateway (deployed to Cloud Run)
/worker     - FastAPI handler for RunPod inference
/convex     - Convex schema and functions
```

## Data Model (Convex)

**users**: `{ id, clerkId, email, plan, credits, createdAt }`
**jobs**: `{ id, userId, prompt, durationSec, creditsUsed, r2Url, status, expiresAt, createdAt, seed, cfg }`
**plans**: `{ id, name, monthlyCredits, price, markup }`
**payments**: `{ id, userId, trueLayerTxnId, amount, timestamp }`

### Key Convex Functions
- `reserveCredits(userId, credits)` - Check balance and decrement credits
- `settleCredits(jobId)` - Finalize cost after successful job
- `refundCredits(jobId)` - Refund credits on failed jobs
- `jobsByUser(userId)` - List user's recent jobs

## Video Generation Flow

1. User submits prompt + optional image + duration (5/10/15s)
2. API verifies Clerk JWT → check/reserve credits via Convex
3. API submits job to RunPod: `POST /v2/<ENDPOINT_ID>/run`
4. RunPod worker loads Wan2.2 from Network Volume, generates MP4, uploads to R2
5. RunPod webhook → API Gateway `/webhooks/runpod`
6. API updates Convex: status=done, expiresAt=now+24h (or refund on failure)
7. R2 auto-deletes files after 24 hours

## Credits System

- 1 credit = 5 seconds of video
- 5s = 1 credit, 10s = 2 credits, 15s = 3 credits
- Subscription tiers:
  - Starter: 80 credits/mo ($10)
  - Creator: 250 credits/mo ($31)
  - Studio: 500 credits/mo ($60)

## API Endpoints

**POST /jobs/create** - Create new generation job
```json
{
  "prompt": "A silver drone flies through neon skyline",
  "imageUrl": null,
  "durationSec": 5,
  "seed": 42
}
```

**GET /jobs/:id** - Get job status and video URL
**POST /webhooks/runpod** - RunPod completion webhook (verify WEBHOOK_RUNPOD_SECRET)
**GET /credits** - Fetch user's remaining credits
**POST /subscribe** - Start TrueLayer subscription flow

## Environment Variables

### Cloud Run (API Gateway)
```
CLERK_JWKS_URL=https://<your_clerk_domain>/.well-known/jwks.json
CONVEX_URL=<convex_deployment_url>
CONVEX_ADMIN_KEY=<convex_admin_key>
RUNPOD_ENDPOINT_ID=<id>
RUNPOD_API_KEY=<key>
R2_ACCOUNT_ID=<acct_id>
R2_BUCKET=cineweave-outputs
R2_ACCESS_KEY_ID=<r2_key>
R2_SECRET_ACCESS_KEY=<r2_secret>
R2_PUBLIC_DOMAIN=https://<your-r2-public-domain>
WEBHOOK_RUNPOD_SECRET=<shared_secret>
APP_BASE_URL=https://app.cineweave.com
```

### RunPod Worker
```
R2_* (same as above for upload capability)
WAN_WEIGHTS_DIR=/runpod-volume/wan22/weights
WAN_MODEL_VARIANT=ti2v-5b
WAN_RESOLUTION=720p
WAN_FPS=24
```

## Development Commands

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run ESLint
```

### API Gateway (FastAPI)
```bash
cd gateway
pip install -r requirements.txt
uvicorn main:app --reload    # Start dev server
pytest                       # Run tests
```

### Worker (FastAPI/RunPod)
```bash
cd worker
pip install -r requirements.txt
# Build Docker image for RunPod deployment
docker build -t cineweave-worker .
```

### Convex
```bash
cd convex
npx convex dev       # Start local dev environment
npx convex deploy    # Deploy to production
```

## Key Technical Constraints

**Video Specs**: 720p resolution, 24fps, MP4 format
**Max Duration**: 15 seconds per generation
**Storage**: All videos auto-delete after 24 hours (R2 lifecycle policy)
**GPU**: H100 via RunPod Serverless, ~60 seconds compute time per 5s clip
**Model**: Wan 2.2-TI2V-5B loaded from Network Volume for fast cold starts

## Cost Assumptions

- H100 Flex: $0.00116/sec
- 5s clip generation: ~60s GPU time = ~$0.07 per video
- Network Volume: ~$0.05-$0.07/GB-mo (shared weights across workers)
- R2 storage: negligible with 24h TTL

## Security Requirements

- **All API requests**: Verify Clerk JWT
- **RunPod webhooks**: Verify `WEBHOOK_RUNPOD_SECRET`
- **R2 URLs**: Use signed URLs with ≤24h expiry (or public with lifecycle TTL)
- **Rate limiting**: Max 5 concurrent jobs per user
- **Input validation**: Prompt length caps, image file type whitelist
- **PII**: Store minimal data, rely on Clerk for identity

## UI/UX Guidelines

**Theme**: Purple, red, blue gradient palette - cinematic and modern
**Key Pages**:
- Dashboard: credits remaining, new job button, recent renders
- Create: prompt input + optional image upload + clip length selector (5/10/15s)
- Job Viewer: status tracker, video preview, download CTA
- Account: billing, credits, profile
- Admin: jobs, users, spend tracking

## Performance Targets

- Average render time (5s clip): ≤ 1 minute on H100
- Cold start latency: < 10 seconds (cached model + Network Volume)
- API response (non-generation): < 300ms
- Storage cleanup: 24h auto-delete via R2 lifecycle

## Deployment Strategy

**Frontend**: Deploy to Vercel or Cloud Run
**API Gateway**: Cloud Run with min-instances=1 for instant responses
**Worker**: RunPod Serverless endpoint with Network Volume
**Convex**: Standard Convex deployment
**CI/CD**: GitHub Actions on push to main
  - Build/push gateway image → deploy Cloud Run
  - Build/push worker image → update RunPod endpoint
  - Deploy Convex changes
  - Build/deploy frontend

## RunPod Worker Implementation Notes

The worker must:
1. Load Wan2.2 model from `${WAN_WEIGHTS_DIR}` into VRAM
2. Accept JSON payload: `{ prompt, imageUrl?, durationSec, seed? }`
3. Generate video at 720p/24fps for specified duration
4. Upload MP4 to R2 using boto3 S3 client
5. Return `{ r2Url, durationSec, seed }`

Use RunPod's built-in Job API (Option A): expose a `/run` endpoint that RunPod wraps automatically.
