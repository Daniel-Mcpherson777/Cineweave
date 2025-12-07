# CineWeave Quick Start Guide

The fastest path from zero to a working AI video generation app.

---

## Where You Are Now

✅ **Completed:**
- Clerk authentication configured
- Convex database tables created manually
- Cloudflare R2 storage configured
- All environment variables set
- Complete codebase ready

⏸️ **Next Step:**
- Set up RunPod with Wan 2.2 model

---

## Two Paths Forward

### Path 1: Full Setup with Real AI (Recommended for Production)

**Time:** 2-4 hours
**Cost:** ~$5 to start
**Result:** Fully functional AI video generation

**Follow:** `RUNPOD_SETUP.md` (complete step-by-step guide)

**Quick summary:**
1. Find Wan 2.2 model on Hugging Face
2. Create RunPod account ($10 credit)
3. Create Network Volume (25GB, $2.50/month)
4. Download model to volume using temporary pod
5. Build and push Docker image
6. Create RunPod Serverless endpoint
7. Update gateway/.env with endpoint credentials
8. Test end-to-end

### Path 2: Test Now with Mock AI (Quick Testing)

**Time:** 5 minutes
**Cost:** Free
**Result:** Test the app flow without real video generation

The worker currently has placeholder code that creates a dummy video file. This lets you test:
- User signup and authentication
- Credit system
- Job submission and tracking
- UI/UX flow

**To test now:**

```bash
# Terminal 1 - API Gateway
cd ~/Cineweave/gateway
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8080

# Terminal 2 - Frontend
cd ~/Cineweave/frontend
npm install
npm run dev

# Open browser to http://localhost:3000
```

**Note:** Videos won't actually be generated (placeholder only), but you can test the entire flow.

---

## Recommended Approach

**For now:**
1. Start with **Path 2** (5 minutes) to see the app working
2. Create an account, test the UI, verify credits work
3. Get familiar with the flow

**Then:**
1. Follow **Path 1** (`RUNPOD_SETUP.md`) when ready for real AI
2. This requires finding the model and setting up RunPod
3. Full production-ready system

---

## Current Environment Status

### Frontend (`frontend/.env.local`)
```env
✅ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
✅ CLERK_SECRET_KEY
✅ NEXT_PUBLIC_CONVEX_URL
✅ NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Gateway (`gateway/.env`)
```env
✅ CLERK_JWKS_URL
✅ CLERK_ISSUER
✅ CONVEX_URL
✅ CONVEX_ADMIN_KEY
✅ R2_ACCOUNT_ID
✅ R2_BUCKET
✅ R2_ACCESS_KEY_ID
✅ R2_SECRET_ACCESS_KEY
✅ R2_PUBLIC_DOMAIN
✅ R2_ENDPOINT_URL
⚠️ RUNPOD_ENDPOINT_ID (mock)
⚠️ RUNPOD_API_KEY (mock)
✅ WEBHOOK_RUNPOD_SECRET
```

### What Needs Real Values

Only these need updating for full production:
- `RUNPOD_ENDPOINT_ID` - Get from RunPod after creating endpoint
- `RUNPOD_API_KEY` - Get from RunPod after creating endpoint

Everything else is configured and ready!

---

## File Reference

| File | Purpose |
|------|---------|
| `RUNPOD_SETUP.md` | Complete RunPod + Wan 2.2 setup guide (7 parts, ~600 lines) |
| `worker/handler_real.py` | Production worker code with real AI model integration |
| `worker/handler.py` | Current placeholder worker (for testing) |
| `SETUP_STATUS.md` | Tracks what's been configured |
| `CONVEX_ISSUES.md` | Documents Convex CLI bug and workaround |
| `DEPLOYMENT.md` | Production deployment guide |
| `DEVELOPMENT.md` | Local development guide |

---

## First-Time Testing Checklist

When you run the app for the first time:

1. **Sign up** with a new account
2. **Check dashboard** - should show 80 credits
3. **Click "Create Video"**
4. **Enter a prompt** - anything you want
5. **Select 5 seconds** (costs 1 credit)
6. **Submit**
7. **Watch the job page** - status should update
8. **Check credits** - should decrease to 79

With mock worker, the video won't be real, but everything else works!

---

## What Each Service Does

| Service | What It Does | Status |
|---------|-------------|---------|
| **Clerk** | User authentication (login/signup) | ✅ Working |
| **Convex** | Database (users, jobs, credits, plans) | ✅ Working (manual setup) |
| **Cloudflare R2** | Video file storage | ✅ Working |
| **RunPod** | GPU compute for AI video generation | ⏸️ Mock values |
| **Frontend** | Next.js app users interact with | ✅ Ready |
| **Gateway** | FastAPI backend connecting everything | ✅ Ready |

---

## Cost Breakdown

### Current Costs (Zero!)
- Clerk: Free tier (10,000 users)
- Convex: Free tier
- R2: Free tier (10GB storage)
- Frontend: Free (local)
- Gateway: Free (local)

### Adding RunPod (Optional)
- Network Volume: $2.50/month (25GB)
- GPU usage: Pay per second (only when generating videos)
- Testing: ~$0.50-2 total
- Production: ~$0.0066 per 5-second video

### Example Production Costs
- 1,000 videos/month: ~$9/month
- 10,000 videos/month: ~$73/month

Compare to revenue:
- 1,000 videos = $100 revenue (93% margin)
- 10,000 videos = $1,000 revenue (93% margin)

---

## Next Steps

**Option A: Test the app now (5 min)**
```bash
# Just start the servers and open localhost:3000
# See "Path 2" above for commands
```

**Option B: Set up RunPod for real AI (2-4 hours)**
```bash
# Open RUNPOD_SETUP.md and follow Part A-F
# Then test the complete system with real video generation
```

**Option C: Both!**
1. Test now with mock (5 min)
2. Set up RunPod later when ready (2-4 hours)
3. Replace mock with real and retest

---

## Getting Help

If you run into issues:

1. **Check the logs:**
   - Gateway terminal: Shows API errors
   - Frontend terminal: Shows build errors
   - Browser console: Shows frontend errors

2. **Check environment variables:**
   - Gateway: `cat gateway/.env`
   - Frontend: `cat frontend/.env.local`

3. **Check specific docs:**
   - Convex issues: `CONVEX_ISSUES.md`
   - RunPod setup: `RUNPOD_SETUP.md`
   - Deployment: `DEPLOYMENT.md`

4. **Common issues:**
   - Port 8080 or 3000 already in use: Kill existing processes
   - Convex connection errors: Check CONVEX_URL
   - Clerk errors: Check publishable key matches domain
   - R2 errors: Check credentials and bucket name

---

## The Full Picture

```
User → Frontend (Next.js) → Gateway (FastAPI) → RunPod (GPU)
         ↓                      ↓                    ↓
       Clerk              Convex DB             R2 Storage
    (Auth/Users)      (Jobs/Credits)         (Video Files)
```

**Flow:**
1. User signs up → Clerk creates account → Convex stores user
2. User creates video → Gateway reserves credits → Submits to RunPod
3. RunPod generates video → Uploads to R2 → Sends webhook
4. Gateway updates job status → User sees video → Can download

**Your current status:**
- Frontend ✅
- Gateway ✅
- Clerk ✅
- Convex ✅
- R2 ✅
- RunPod ⏸️ (next step)

---

**You're so close! Just RunPod left to make this fully functional.** 🚀

Choose your path and let me know if you need any clarification!
