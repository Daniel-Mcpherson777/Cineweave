Product Requirements Document (PRD)
Product Name: 🎬 CineWeave
Tagline: Weave cinematic motion from text or images — AI-powered video generation at 720p, 24 fps.
1. Product Vision
CineWeave empowers creators to transform ideas, text prompts, or reference images into cinematic, AI-generated videos at 720p/24fps — fast, affordable, and accessible from the browser.
Built on Wan 2.2-TI2V-5B, it brings professional-quality motion generation to creators, educators, and studios without technical setup.
2. Core Objectives
Enable users to generate 5–15s cinematic videos directly from text or image.
Provide seamless, branded experience via React web app.
Minimize cost per inference using RunPod Serverless (H100 + Network Volume).
Implement Clerk Auth, Convex for user/credit data, Cloud Run for the API layer, Cloudflare R2 for temporary video storage (24h auto-delete).
Support monetization via TrueLayer for EU/UK instant payments.
3. Target Users
🎥 Content creators: social media clips, brand teasers, short cinematic content.
🏫 Educators & explainer video makers: quick illustrative visualizations.
🎮 Indie game devs and artists: prototyping concepts or storyboards.
4. Success Metrics
Metric	Target
Avg. generation time (5s)	≤ 1 minute (H100)
Video success rate	≥ 95%
Repeat usage	≥ 20% week-2 retention
Infrastructure margin	within target markups per plan
5. User Stories
Auth: Login/sign-up with social/email (Clerk).
Credits: View monthly credits, usage history, and balance.
Video creation: Enter text or upload an image → select clip length (5, 10, 15s).
Progress: Track real-time job status (queued → running → complete).
Results: Preview, download, or export videos within 24 hours.
Billing: Subscribe to a plan, manage renewals via TrueLayer.
Admin (internal): View jobs, credit burn, errors, and cost tracking.
6. UX / UI
Theme: Purple, Red, Blue gradient palette — cinematic and modern.
Pages:
Dashboard — credits remaining, new job button, recent renders.
Create — prompt + optional image upload + clip length selector.
Job Viewer — status tracker, video preview, “Download” CTA.
Account — billing, credits, profile.
Admin console — jobs, users, spend.
7. Functional Requirements
Generation
Input: prompt, image, duration (5|10|15s), optional seed.
Output: .mp4 (720p, 24fps).
Max duration: 15s (3 credits).
RunPod job pipeline: uses built-in Serverless Job API.
Storage
Cloudflare R2 object bucket (cineweave-outputs).
Lifecycle policy: auto-delete after 24h.
Convex stores job metadata, user IDs, credit consumption.
Credits
1 credit = 5 seconds of video.
10s = 2 credits, 15s = 3 credits.
Each generation deducts from user’s balance.
8. Technical Architecture
System Overview
Frontend (React / Next.js)
  ↕ (Clerk session)
API Gateway (Cloud Run, FastAPI)
  ↕ (REST)
RunPod Serverless (H100 + Network Volume)
  ↕ (model output)
Cloudflare R2 (24h storage)
  ↕ (video URL)
Convex (users, jobs, credits)
Clerk (auth)
TrueLayer (payments)
Key Technologies
Layer	Technology	Role
Auth	Clerk	OAuth & session management
Data	Convex	Store users, credits, jobs
API Gateway	Google Cloud Run (FastAPI)	Securely mediate between UI & RunPod
AI Inference	RunPod Serverless (H100, Network Volume)	Run Wan 2.2 model
File Storage	Cloudflare R2	Temporary video storage (24h auto-deletion)
Payments	TrueLayer	Subscription and top-ups via Open Banking
Frontend	React / Next.js	UI/UX with cinematic theme
9. API Endpoints (Summary)
Endpoint	Description
POST /jobs/create	Creates a new generation job, deducts credits
GET /jobs/:id	Retrieve job status and download link
POST /webhooks/runpod	RunPod job completion callback
GET /credits	Fetch user’s remaining credits
POST /subscribe	Start TrueLayer subscription flow
10. Data Model (Convex)
Tables
users → { id, clerkId, email, plan, credits, createdAt }
jobs → { id, userId, prompt, durationSec, creditsUsed, r2Url, status, expiresAt, createdAt }
plans → { id, name, monthlyCredits, price, markupPct }
payments → { id, userId, trueLayerTxnId, amount, timestamp }
Functions
reserveCredits(userId, credits)
refundCredits(userId, credits)
updateJobStatus(jobId, status)
expireOldJobs()
11. Video Lifecycle
User submits prompt → /jobs/create.
API gateway checks credits (Convex).
Job submitted to RunPod Serverless API.
RunPod runs model, uploads result to R2.
RunPod triggers webhook → Cloud Run.
Cloud Run marks job status=done and sets expiresAt=+24h.
Cloudflare auto-deletes video file after 24 hours.
12. Cost & Pricing Model
Base cost assumptions
H100 Flex: $0.00116/sec
Generation time (5s clip): ~60 seconds GPU runtime
→ Cost per 5s video = $0.07
Subscription Tiers (with Markup Pricing)
Plan	Credits	Cost (to us)	Markup	User Price	Effective price per credit	Notes
Starter	80	80 × $0.07 = $5.60	+85% markup	$10.36 / mo (≈ $10)	$0.125	Entry tier for casual users
Creator	250	250 × $0.07 = $17.50	+75% markup	$30.63 / mo (≈ $31)	$0.124	Mid-tier for creators
Studio	500	500 × $0.07 = $35.00	+70% markup	$59.50 / mo (≈ $60)	$0.12	Agencies / heavy users
Optional Add-ons
Extra credits: $0.25/credit (flat post-paid top-up).
15s job = 3 credits → ≈ $0.37 in cost terms (Starter tier).
10s job = 2 credits → ≈ $0.25 in cost terms.
Margins
These prices yield markups, not margins:
Starter: 85% markup (≈ 46% margin)
Creator: 75% markup (≈ 43% margin)
Studio: 70% markup (≈ 41% margin)
✅ Still sustainable, since COGS is minimal and scaling is linear.
13. Performance Targets
Metric	Target
Average render time (5s @ 720p/24fps)	1 min on H100
Cold start latency	< 10 sec (cached model + Network Volume)
API response (non-generation endpoints)	< 300 ms
Storage cleanup delay	24h (auto-delete via R2 lifecycle)
14. Rollout Plan
Milestone	Deliverables	Duration
A	RunPod worker container w/ FastAPI; 720p clip proof	2 weeks
B	Cloud Run gateway + Convex schema + Clerk auth	2 weeks
C	UI integration (React + Clerk) + R2 storage	2 weeks
D	TrueLayer billing integration + production testing	2 weeks
E	Public beta launch	1 week
15. Risks & Mitigations
Risk	Mitigation
RunPod cold starts	Keep 1 pod warm; pre-cache model
GPU cost fluctuation	Dynamic job routing (L40S backup)
Storage overrun	Auto-delete 24h policy
User abuse / NSFW	Prompt filtering & moderation
Payment failure	TrueLayer webhook reconciliation
16. Future Enhancements
1080p upscale option via FramePack.
AI voice dubbing (Kokoro TTS integration).
Character persistence tools.
Prompt library & templates.
Team workspaces & seat-based billing.
17. Key Differentiators
Real AI video, not slideshow or animation interpolation.
True cinematic motion (24fps, 720p).
Clean, modern interface — purple/red/blue gradient identity.
Transparent pricing and usage-based credits.
24h ephemeral storage (privacy-friendly + cost-effective).
✅ Summary
Component	Stack
Auth	Clerk
Data / Logic	Convex
Compute	RunPod H100 Serverless
Storage	Cloudflare R2 (24h expiry)
Payments	TrueLayer
Gateway	Cloud Run (FastAPI)
Frontend	React / Next.js

CineWeave — Architecture & Implementation Plan
1) High-level architecture (text diagram)
[ Web App (React/Next.js) ]
        │  (Clerk session JWT)
        ▼
[ API Gateway (Cloud Run / FastAPI) ]  ───────────────────────────────────────────┐
   • AuthZ: verify Clerk JWT                                                     │
   • Credits: Convex reserve/settle/refund                                       │
   • Submit job to RunPod Serverless (Option A)                                  │
   • Receive RunPod webhook (job done / failed)                                  │
   • Generate signed URL for R2 download                                         │
        │                                                                        │
        │ REST                                                                   │
        ▼                                                                        │
[ Convex ]  <──▶  [ Cloudflare R2 (24h TTL) ]  ◀──  [ RunPod Serverless Worker ] │
  • users, jobs, credits, plans                     • Upload output MP4 to R2     │
  • business logic (reserve/settle/refund)          • Loads Wan2.2 from NV        │
                                                    • H100 + Network Volume       │
                                                    • Built-in RunPod Job API     │
        ▲                                                                        │
        │ Webhooks                                                                │
        └─────────────────────────────────────────────────────────────────────────┘

[ TrueLayer ]  ←→  [ API Gateway ]  (subscriptions & top-ups via Open Banking)
[ Clerk ]      ←→  [ Web App + API Gateway ]  (auth & sessions)
2) End-to-end request flow (sequence)
A) Create a job
User → Web App: enters prompt (+ optional image), selects 5/10/15 s.
Web App → API Gateway /jobs/create with Clerk session token.
API verifies Clerk JWT → userId.
API → Convex: reserveCredits(userId, creditsNeeded).
API → RunPod: POST /v2/<ENDPOINT_ID>/run with input payload (prompt, duration, seed, R2 upload params).
API → Convex: insert jobs(row) with status queued.
API → Web App: returns { jobId }.
B) RunPod completes
RunPod worker runs Wan2.2 on H100, writes MP4 to R2, returns r2Url & metadata.
RunPod → API: calls webhook /webhooks/runpod with { jobId, status, r2Url }.
API:
On COMPLETED: Convex.settleCredits, jobs.status='done', set expiresAt=now+24h.
On FAILED: Convex.refundCredits, jobs.status='failed'.
Web App polls /jobs/:id (or subscribe via Convex) → shows playable link.
R2 lifecycle deletes file automatically at T+24h.
3) Environment variables (single source of truth)
Cloud Run (API Gateway)
CLERK_JWKS_URL=https://<your_clerk_domain>/.well-known/jwks.json
CONVEX_URL=<convex_deployment_url>
CONVEX_ADMIN_KEY=<convex_admin_key>
RUNPOD_ENDPOINT_ID=<id>
RUNPOD_API_KEY=<key>
R2_ACCOUNT_ID=<acct_id>
R2_BUCKET=cineweave-outputs
R2_ACCESS_KEY_ID=<r2_key>
R2_SECRET_ACCESS_KEY=<r2_secret>
R2_PUBLIC_DOMAIN=https://<your-r2-public-domain> (or sign URLs via API)
WEBHOOK_RUNPOD_SECRET=<shared_secret>
APP_BASE_URL=https://app.cineweave.com
RunPod Worker
R2_* same as above (so worker can upload)
WAN_WEIGHTS_DIR=/runpod-volume/wan22/weights
WAN_MODEL_VARIANT=ti2v-5b
WAN_RESOLUTION=720p
WAN_FPS=24
Convex
standard Convex deployment secrets.
TrueLayer
TRUELAYER_CLIENT_ID, TRUELAYER_CLIENT_SECRET, TRUELAYER_REDIRECT_URI, TRUELAYER_WEBHOOK_SECRET
4) Service-by-service setup
4.1 Clerk (Auth)
Create Clerk app → enable email/password + Google/Apple.
Configure allowed origins: https://app.cineweave.com, https://api.cineweave.com.
In Next.js, install @clerk/nextjs, wrap app with <ClerkProvider>.
In Cloud Run, validate JWT by fetching Clerk JWKS (cache keys for 5–10 min).
4.2 Convex (Data & credit logic)
npx convex dev to init; deploy project.
Tables:
users: { id, clerkId, email, plan, credits, createdAt }
jobs: { id, userId, prompt, durationSec, creditsUsed, r2Url, status, expiresAt, createdAt, seed, cfg }
plans: { id, name, monthlyCredits, price, markup }
Functions (server):
reserveCredits(userId, credits) — check balance; decrement; create ledger.
settleCredits(jobId) — finalize cost; link to ledger entry.
refundCredits(jobId) — increment credits if failed.
jobsByUser(userId) — list recent jobs.
Seed plans with your three tiers (80/250/500 credits).
4.3 Cloudflare R2 (24-hour retention)
Create R2 bucket cineweave-outputs.
Lifecycle rule: Delete objects after 1 day (24 hours).
Optional: set public domain or use signed URLs (recommended) expiring within 24 h.
4.4 RunPod Serverless (H100 + Network Volume)
Create a Network Volume (same region as endpoint). Upload Wan2.2 weights once into /wan22/weights.
Build worker container (FastAPI + inference script) that:
Reads payload from RunPod job input.
Loads model from ${WAN_WEIGHTS_DIR} into VRAM (respect WAN_FPS, WAN_RESOLUTION).
Renders video → uploads to R2 with PUT.
Returns { r2Url, durationSec, seed } in the job output.
Deploy as Serverless endpoint (Option A: built-in RunPod Job API).
Enable Model/Worker caching if available in your plan.
Test with a sample job using curl to /v2/<ENDPOINT_ID>/run.
4.5 Cloud Run (API Gateway)
Containerize FastAPI gateway; expose:
POST /jobs/create
GET /jobs/{id}
POST /webhooks/runpod
GET /credits
/billing/* (TrueLayer flows)
Set min-instances: 1 (tiny cost, instant responses).
Assign service account with no public access; front with HTTPS and a CDN if you like.
Add rate limits (e.g., Cloud Armor or app-level).
4.6 TrueLayer (Payments)
Create application; enable Payments (Recurring or PIS) for UK/EU.
Implement hosted payment pages or embedded flows.
Webhooks: on PAYMENT_CONFIRMED, credit user via Convex.addCredits.
5) Minimal API contracts (FastAPI)
POST /jobs/create
Request:
{
  "prompt": "A silver drone flies through neon skyline",
  "imageUrl": null,
  "durationSec": 5,
  "seed": 42
}
Response:
{ "jobId": "job_abc123" }
GET /jobs/:id
{
  "status": "done",
  "r2Url": "https://r2.cdn/.../abc123.mp4",
  "expiresAt": "2025-11-04T12:30:00Z",
  "durationSec": 5
}
POST /webhooks/runpod
Payload (from RunPod):
{
  "id": "job_abc123",
  "status": "COMPLETED",
  "output": { "r2Url": "https://...", "durationSec": 5, "seed": 42 }
}
Gateway behavior:
Verify signature with WEBHOOK_RUNPOD_SECRET.
On COMPLETED: settleCredits, update job row, set expiry.
On FAILED: refundCredits.
6) Worker stubs
6.1 RunPod worker (FastAPI handler for Option A)
# handler.py (simplified)
import os, uuid, boto3
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()
R2 = boto3.client(
    "s3",
    endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
    aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
    aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
)
BUCKET = os.environ["R2_BUCKET"]

class Input(BaseModel):
    prompt: str
    imageUrl: str | None = None
    durationSec: int = 5
    seed: int | None = None

@app.post("/run")
def run_job(inp: Input):
    # 1) Load Wan2.2 from NV (weights dir from env)
    # 2) Generate video file at 720p@24fps for inp.durationSec
    outfile = f"/workspace/out/{uuid.uuid4()}.mp4"
    # ... run model → write outfile ...

    # 3) Upload to R2
    key = f"outputs/{os.path.basename(outfile)}"
    R2.upload_file(outfile, BUCKET, key)
    r2_url = f"{os.environ['R2_PUBLIC_DOMAIN']}/{key}"

    return {
        "r2Url": r2_url,
        "durationSec": inp.durationSec,
        "seed": inp.seed
    }
Option A specifics: you ship a simple /run handler. RunPod’s serverless job API wraps this; you’ll submit jobs to https://api.runpod.ai/v2/<endpoint>/run.
6.2 Cloud Run gateway (very minimal FastAPI)
from fastapi import FastAPI, Request, HTTPException
import httpx, os

app = FastAPI()
RUNPOD_ENDPOINT = os.environ["RUNPOD_ENDPOINT_ID"]
RUNPOD_API_KEY = os.environ["RUNPOD_API_KEY"]

@app.post("/jobs/create")
async def create_job(req: Request):
    data = await req.json()
    # 1) Verify Clerk JWT (omitted: fetch JWKS & validate)
    # 2) Reserve credits via Convex
    # 3) Submit to RunPod
    payload = {"input": data}
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"https://api.runpod.ai/v2/{RUNPOD_ENDPOINT}/run",
            headers={"Authorization": f"Bearer {RUNPOD_API_KEY}"},
            json=payload
        )
    r.raise_for_status()
    res = r.json()
    job_id = res.get("id")
    # 4) Insert Convex job
    return {"jobId": job_id}
7) CI/CD (recommended)
Repo layout
/frontend   (Next.js)
/gateway    (FastAPI → Cloud Run)
/worker     (FastAPI handler → RunPod)
/convex     (schema + functions)
GitHub Actions:
On push to main:
Build & push /gateway image to GCR/Artifact Registry → deploy Cloud Run.
Build & push /worker image to GHCR/DockerHub → update RunPod endpoint.
Deploy Convex changes with npx convex deploy.
Build & deploy frontend to Vercel/Cloud Run (your pick).
8) Observability & ops
Cloud Run: logs, request latency, 4xx/5xx alerts.
RunPod: job durations, cold-start counts (new host vs cached).
Convex: credit burns, failed job ratios, per-user usage histograms.
R2: bucket size (should stay low with 24h TTL).
Business: plan uptake, ARPU, churn; adjust credits or pricing if necessary.
9) Cost guardrails (quick reminders)
RunPod Flex H100: ≈ $0.07 per 5s clip (60 s compute @ $0.00116/s).
Network Volume: ~$0.05–$0.07/GB-mo; weights shared across workers.
R2: 24h storage — negligible at short clip sizes; lifecycle deletes save costs.
Cloud Run gateway: pennies/month (mostly free tier).
Keep 1 warm worker for predictable latency; let the rest scale with Flex.
10) Security checklist
Verify Clerk JWT on every API request.
Verify RunPod webhook via WEBHOOK_RUNPOD_SECRET.
Sign R2 download URLs with expiry ≤ 24h (or use public with TTL if you accept public access).
Enforce per-user job caps & rate limits (e.g., 5 concurrent).
Sanitize inputs (prompt length caps, file type whitelist for image uploads).
Store minimal PII; lean on Clerk for identity.
