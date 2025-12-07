# CineWeave 🎬

**Weave cinematic motion from text or images — AI-powered video generation at 720p, 24 fps.**

CineWeave empowers creators to transform ideas, text prompts, or reference images into cinematic, AI-generated videos at 720p/24fps. Built on Wan 2.2-TI2V-5B, it brings professional-quality motion generation to creators, educators, and studios without technical setup.

## Features

- 🎥 Generate 5-15 second cinematic videos from text or images
- ⚡ Fast generation on H100 GPUs (~1 minute for 5s clips)
- 🎨 Modern web interface with purple/red/blue gradient theme
- 💳 Credit-based pricing with subscription tiers
- 🔒 Secure authentication via Clerk
- 📦 Automatic 24-hour video storage with R2
- 🎤 Text-to-speech with Kokoro TTS (82M params)

## Architecture

```
Web App (Next.js) → API Gateway (FastAPI) → RunPod Serverless (H100 + Network Volume)
       ↓                    ↓                           ↓
  Clerk Auth           Convex DB                  Cloudflare R2
                   TrueLayer Payments
```

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **API Gateway**: FastAPI, Python 3.11
- **AI Compute**: RunPod Serverless (H100 SXM GPUs)
- **Models**:
  - Wan 2.2-TI2V-5B (32GB - text/image to video)
  - Kokoro TTS (350MB - text to speech)
- **Database**: Convex (real-time)
- **Storage**: Cloudflare R2 (24h auto-delete lifecycle)
- **Auth**: Clerk
- **Payments**: TrueLayer (Open Banking)

## Repository Structure

```
cineweave/
├── frontend/           # Next.js web application
├── gateway/            # FastAPI API gateway
├── worker/             # RunPod GPU worker (Docker)
├── convex/             # Convex database schema & functions
├── RUNPOD_SETUP.md     # Complete RunPod setup guide
├── QUICK_START.md      # Quick navigation guide
├── SETUP_STATUS.md     # Setup progress tracker
└── CONVEX_ISSUES.md    # Known Convex CLI issues
```

---

## 🚀 Quick Start (Local Testing)

### Prerequisites

- Node.js 18+
- Python 3.11+
- All external services configured (see Setup Status below)

### Terminal 1: Start API Gateway

```bash
cd gateway
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

**Expected output:** `Uvicorn running on http://127.0.0.1:8080`

### Terminal 2: Start Frontend

```bash
cd frontend
npm install
npm run dev
```

**Expected output:** `Ready on http://localhost:3000`

### Test the Application

1. Open browser: **http://localhost:3000**
2. Sign up with any email
3. Check dashboard - should show **80 credits**
4. Click **"Create Video"**
5. Enter prompt: `A majestic eagle soaring through mountain peaks at sunset`
6. Select **5 seconds** duration (costs 1 credit)
7. Click **"Generate Video"**
8. Watch status update: PENDING → PROCESSING → COMPLETED
9. Download and view your AI-generated video!

---

## 📋 Full Setup Guide

### External Services Required

1. **Clerk** (Authentication) - ✅ Configured
   - Account: Free tier
   - Keys: In `frontend/.env.local` and `gateway/.env`

2. **Convex** (Database) - ✅ Configured (Manual Setup)
   - Tables created via dashboard
   - Deploy key in `gateway/.env`
   - Note: CLI deployment blocked (see CONVEX_ISSUES.md)

3. **Cloudflare R2** (Storage) - ✅ Configured
   - Bucket: `cineweave-outputs`
   - Lifecycle: Auto-delete after 24 hours
   - Credentials in `gateway/.env`

4. **RunPod** (GPU Compute) - ✅ Configured
   - Serverless endpoint with H100 SXM
   - Network volume (40GB) with models:
     - Wan 2.2-TI2V-5B (32GB)
     - Kokoro TTS (361MB)
   - Worker image: `dandocker666/cineweave-worker:latest`
   - Credentials in `gateway/.env`

5. **TrueLayer** (Payments) - ⏸️ Optional (not required for testing)

### Detailed Setup Instructions

For complete step-by-step setup of all services:
- **RunPod + Models**: See [RUNPOD_SETUP.md](./RUNPOD_SETUP.md)
- **Quick Navigation**: See [QUICK_START.md](./QUICK_START.md)
- **Setup Progress**: See [SETUP_STATUS.md](./SETUP_STATUS.md)

---

## 🔧 Configuration Files

### Frontend Environment (`frontend/.env.local`)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CONVEX_URL=https://affable-monitor-289.convex.cloud
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Gateway Environment (`gateway/.env`)

```env
# Clerk Authentication
CLERK_JWKS_URL=https://accurate-drum-4.clerk.accounts.dev/.well-known/jwks.json
CLERK_ISSUER=https://accurate-drum-4.clerk.accounts.dev

# Convex Database
CONVEX_URL=https://affable-monitor-289.convex.cloud
CONVEX_ADMIN_KEY=prod:judicious-firefly-242|...

# RunPod Configuration
RUNPOD_ENDPOINT_ID=0o8vgjjbfovbxu
RUNPOD_API_KEY=rpa_...
RUNPOD_API_URL=https://api.runpod.ai/v2

# Cloudflare R2 Storage
R2_ACCOUNT_ID=0681fbcbe78d97ddc0600e26eb3034cc
R2_BUCKET=cineweave-outputs
R2_ACCESS_KEY_ID=f03a94fc9cc4e9a700e558af4380e60d
R2_SECRET_ACCESS_KEY=ec96e62953587b780fb8a57f0ecc9fcdcde4d55ea2053921c309dc1f4cec161e
R2_PUBLIC_DOMAIN=https://pub-b50a9a46bd634aeda4c8727ad0176fc3.r2.dev
R2_ENDPOINT_URL=https://0681fbcbe78d97ddc0600e26eb3034cc.r2.cloudflarestorage.com

# Webhook Security
WEBHOOK_RUNPOD_SECRET=dev-secret-change-in-production-123456

# Application Settings
APP_BASE_URL=http://localhost:3000
ENVIRONMENT=development
LOG_LEVEL=DEBUG
MAX_CONCURRENT_JOBS_PER_USER=5
```

---

## 💰 Pricing Model

### Subscription Tiers

| Plan | Credits | Price | Features |
|------|---------|-------|----------|
| **Starter** | 80/month | $10 | ~6-7 min video, 720p@24fps, Email support |
| **Creator** | 250/month | $31 | ~20 min video, Priority queue, Email support |
| **Studio** | 500/month | $60 | ~40 min video, Priority queue, Dedicated support |

**Credits:** 1 credit = 5 seconds of video
- 5s video = 1 credit
- 10s video = 2 credits
- 15s video = 3 credits

### Cost Breakdown (per 5s video)

- GPU (H100): $0.07
- Storage (R2): <$0.01
- Database (Convex): <$0.01
- **Total Cost:** ~$0.07
- **User Price:** $0.125 (Starter tier)
- **Gross Margin:** 43%

---

## 📊 Performance

- **Generation Time**: ~60 seconds for 5s clip on H100
- **Cold Start**: <10 seconds (FlashBoot enabled)
- **API Latency**: <300ms (non-generation endpoints)
- **Video Quality**: 720p @ 24fps
- **Storage Lifecycle**: 24-hour auto-deletion

---

## 🐳 Worker Deployment

### Build Docker Image

```bash
cd worker
docker build -t dandocker666/cineweave-worker:latest .
docker push dandocker666/cineweave-worker:latest
```

### RunPod Configuration

- **GPU**: H100 SXM (80GB VRAM)
- **Network Volume**: 40GB (CA-MTL-3 datacenter)
  - `/runpod-volume/wan22/weights/` - Wan 2.2 model (32GB)
  - `/runpod-volume/kokoro/weights/` - Kokoro TTS (361MB)
- **Container Disk**: 20GB
- **Scaling**: 0-3 workers, queue-based
- **Timeout**: 600 seconds

---

## 🔒 Security

- ✅ Clerk JWT verification on all API requests
- ✅ RunPod webhook signature verification
- ✅ R2 presigned URLs with 24h expiry
- ✅ Rate limiting (5 concurrent jobs per user)
- ✅ Input validation (prompt length, file types)
- ✅ No sensitive data in logs

---

## 🐛 Known Issues

### Convex CLI Deployment

**Issue:** Cannot deploy Convex functions via CLI due to esbuild bundling errors.

**Workaround:** Tables created manually via Convex dashboard.

**Status:** Documented in [CONVEX_ISSUES.md](./CONVEX_ISSUES.md)

**Impact:**
- ✅ Database works correctly
- ✅ Tables and data functional
- ❌ Functions must be updated manually

---

## 📁 Project Files

### Documentation
- `RUNPOD_SETUP.md` - Complete RunPod setup guide (7 parts, 600+ lines)
- `QUICK_START.md` - Navigation and quick reference
- `SETUP_STATUS.md` - Setup progress tracker
- `CONVEX_ISSUES.md` - Known Convex CLI issues
- `DEPLOYMENT.md` - Production deployment guide
- `DEVELOPMENT.md` - Local development guide
- `PROJECT_STATUS.md` - Overall project completion status

### Code
- `frontend/` - Next.js application
- `gateway/` - FastAPI backend
- `worker/` - RunPod GPU worker
- `convex/` - Database schema and functions

---

## 🚢 Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete production deployment instructions including:

- Google Cloud Run deployment (API Gateway)
- Vercel deployment (Frontend)
- Environment variable configuration
- SSL/HTTPS setup
- Monitoring and logging
- Cost optimization

---

## 📈 Development Roadmap

### Completed ✅
- Full-stack application architecture
- Clerk authentication integration
- Convex database with manual setup
- Cloudflare R2 storage with lifecycle
- RunPod Serverless with H100 SXM
- Wan 2.2-TI2V-5B model integration
- Kokoro TTS model integration
- Docker worker deployment
- Credit system with rate limiting

### In Progress 🔄
- TrueLayer payment integration
- Convex CLI deployment fix

### Planned 📋
- 1080p video upscaling
- Character persistence tools
- Prompt library and templates
- Team workspaces
- Analytics dashboard
- Admin console improvements

---

## 🤝 Contributing

This is a production SaaS application. For questions or issues:

1. Check existing documentation (QUICK_START.md, RUNPOD_SETUP.md)
2. Review SETUP_STATUS.md for current configuration
3. Open an issue for bugs or feature requests

---

## 📄 License

[Add your license here]

---

## 🎯 Quick Links

- **Live Demo**: [Add URL when deployed]
- **Documentation**: See individual README files in each directory
- **Setup Guide**: [RUNPOD_SETUP.md](./RUNPOD_SETUP.md)
- **Status**: [SETUP_STATUS.md](./SETUP_STATUS.md)

---

**Built with Claude Code** 🤖
