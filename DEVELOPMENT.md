# CineWeave Development Guide

This guide helps you set up a local development environment for CineWeave.

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Docker (for worker development)
- Git

## Initial Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd Cineweave
```

### 2. Set Up Convex (Database)

```bash
cd convex
npm install
npx convex dev
```

This will:
- Create a new Convex project (first time)
- Generate TypeScript types
- Start local development server
- Give you a deployment URL

Keep this terminal open. Copy the `CONVEX_URL` for later.

In a new terminal, seed the database:
```bash
npx convex run plans:seedPlans
```

### 3. Set Up Clerk (Authentication)

1. Go to https://clerk.com and create a development application
2. Enable Email/Password authentication
3. Add `http://localhost:3000` to allowed origins
4. Copy your keys from the API Keys page

### 4. Set Up R2 (Storage) - Development

For development, you can either:

**Option A: Use Cloudflare R2 (Recommended)**
1. Create a free Cloudflare account
2. Set up R2 bucket as described in DEPLOYMENT.md
3. Use presigned URLs for local testing

**Option B: Mock R2 Locally**
- Use MinIO or LocalStack
- Or return dummy URLs in development

### 5. Set Up RunPod - Development

For development without actual GPU inference:

**Option A: Mock Worker**
- The worker handler includes placeholder code
- Generates dummy video files
- Good for testing the full flow

**Option B: Use RunPod Development Endpoint**
- Set up a cheap L40S endpoint for testing
- Use actual model inference

### 6. Configure API Gateway

```bash
cd ../gateway
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
ENVIRONMENT=development
APP_BASE_URL=http://localhost:3000
LOG_LEVEL=DEBUG

# Clerk
CLERK_JWKS_URL=https://your-dev-app.clerk.accounts.dev/.well-known/jwks.json
CLERK_ISSUER=https://your-dev-app.clerk.accounts.dev

# Convex
CONVEX_URL=https://xxxxx.convex.cloud
CONVEX_ADMIN_KEY=your_dev_admin_key

# RunPod (use mock values for development)
RUNPOD_ENDPOINT_ID=dev-endpoint
RUNPOD_API_KEY=dev-key
RUNPOD_API_URL=https://api.runpod.ai/v2

# R2 (use your dev credentials)
R2_ACCOUNT_ID=your_account_id
R2_BUCKET=cineweave-dev
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret
R2_PUBLIC_DOMAIN=https://pub-xxxxx.r2.dev
R2_ENDPOINT_URL=https://your_account_id.r2.cloudflarestorage.com

# Webhook (any secret for dev)
WEBHOOK_RUNPOD_SECRET=dev-secret-123

# Rate limiting
MAX_CONCURRENT_JOBS_PER_USER=5
```

Run the gateway:
```bash
uvicorn main:app --reload --port 8080
```

Test it:
```bash
curl http://localhost:8080/health
```

### 7. Configure Frontend

```bash
cd ../frontend
npm install
```

Create `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Convex
NEXT_PUBLIC_CONVEX_URL=https://xxxxx.convex.cloud

# API Gateway
NEXT_PUBLIC_API_URL=http://localhost:8080

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Run the frontend:
```bash
npm run dev
```

Visit http://localhost:3000

## Development Workflow

### Running All Services

You'll need 3 terminal windows:

**Terminal 1: Convex**
```bash
cd convex
npx convex dev
```

**Terminal 2: API Gateway**
```bash
cd gateway
source venv/bin/activate
uvicorn main:app --reload --port 8080
```

**Terminal 3: Frontend**
```bash
cd frontend
npm run dev
```

### Making Changes

#### Convex Schema Changes
1. Edit `convex/schema.ts`
2. Convex will auto-deploy changes
3. Types are regenerated automatically

#### API Gateway Changes
1. Edit Python files in `gateway/`
2. FastAPI will auto-reload
3. Test with curl or frontend

#### Frontend Changes
1. Edit files in `frontend/src/`
2. Next.js will hot-reload
3. View changes instantly

#### Worker Changes
1. Edit `worker/handler.py`
2. Rebuild Docker image
3. Push to RunPod

## Testing

### Unit Tests

**Gateway:**
```bash
cd gateway
pytest
pytest --cov  # with coverage
```

### Manual Testing Flow

1. **Sign Up**
   - Go to http://localhost:3000
   - Click "Get Started Free"
   - Create account
   - Should redirect to dashboard

2. **Check Credits**
   - Dashboard should show 80 credits (Starter plan)
   - Plan info should be visible

3. **Create Video**
   - Click "Create Video"
   - Enter prompt: "A drone flies through a neon cityscape"
   - Select 5 seconds
   - Click "Create Video"

4. **Monitor Job**
   - Should redirect to job page
   - Status should be "queued" then "running"
   - With mock worker, will show "done" quickly

5. **Download Video**
   - Video player should appear
   - Download button should work
   - Credits should be deducted

### API Testing

```bash
# Health check
curl http://localhost:8080/health

# Get credits (need auth token)
curl -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  http://localhost:8080/credits

# Create job
curl -X POST http://localhost:8080/jobs/create \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Test video",
    "durationSec": 5
  }'

# Get job status
curl -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  http://localhost:8080/jobs/JOB_ID
```

## Common Development Tasks

### Reset Database
```bash
cd convex
# Delete all data (development only!)
npx convex data clear
# Re-seed plans
npx convex run plans:seedPlans
```

### Add Test Credits
```typescript
// In Convex dashboard, run:
await ctx.db.patch(userId, { credits: 1000 })
```

### Simulate Webhook
```bash
curl -X POST http://localhost:8080/webhooks/runpod \
  -H "Content-Type: application/json" \
  -d '{
    "id": "RUNPOD_JOB_ID",
    "status": "COMPLETED",
    "output": {
      "r2Url": "https://example.com/video.mp4",
      "durationSec": 5,
      "seed": 42
    }
  }'
```

### View Logs

**Frontend:** Browser console
**Gateway:** Terminal output
**Convex:** Convex dashboard logs

## Debugging

### Frontend Not Loading
- Check `.env.local` is configured
- Verify Clerk keys are correct
- Check browser console for errors

### API Gateway Errors
- Check `.env` configuration
- Verify Convex URL and admin key
- Check terminal logs
- Test with curl

### Jobs Not Creating
- Verify authentication works
- Check credits balance
- Look at gateway logs
- Check Convex dashboard for job records

### Videos Not Displaying
- Check R2 credentials
- Verify presigned URL generation
- Check CORS settings
- Look at network tab in browser

## Code Style

### Frontend
- Use TypeScript strict mode
- Follow Next.js conventions
- Use Tailwind for styling
- Components in `src/components/`
- Pages in `src/app/`

### Gateway
- Follow PEP 8
- Use type hints
- Format with Black
- Lint with Ruff
- Keep functions focused and small

### Convex
- Use TypeScript
- Export queries and mutations explicitly
- Validate inputs with Convex validators
- Keep functions pure

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "Add feature: description"

# Push and create PR
git push origin feature/your-feature
```

## Performance Tips

### Frontend
- Use React.memo for expensive components
- Lazy load pages with dynamic imports
- Optimize images with next/image

### Gateway
- Use async/await properly
- Cache JWKS keys
- Pool database connections

### Convex
- Use indexes for queries
- Batch operations when possible
- Avoid N+1 queries

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000 or 8080
lsof -ti:3000 | xargs kill -9
```

### Python Dependencies
```bash
# Reinstall all dependencies
pip install -r requirements.txt --force-reinstall
```

### Node Modules Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Convex Not Syncing
```bash
# Restart Convex dev server
cd convex
npx convex dev --once
npx convex dev
```

## Next Steps

- Read DEPLOYMENT.md for production setup
- Check CLAUDE.md for architecture overview
- Review cineweavePRD.md for full requirements
- Implement TrueLayer payment integration
- Add actual Wan 2.2 model to worker
- Set up error tracking (Sentry)
- Add analytics
