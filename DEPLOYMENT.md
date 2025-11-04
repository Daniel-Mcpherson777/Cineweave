# CineWeave Deployment Guide

This guide walks you through deploying CineWeave to production.

## Prerequisites

- Google Cloud Platform account (for Cloud Run)
- Clerk account (authentication)
- Convex account (database)
- Cloudflare account (R2 storage)
- RunPod account (GPU compute)
- TrueLayer account (payments - optional)
- Vercel account (frontend hosting - optional, can use Cloud Run)

## Step 1: Set Up Clerk Authentication

1. Go to https://clerk.com and create a new application
2. Enable authentication methods:
   - Email/Password
   - Google OAuth
   - Apple OAuth (optional)
3. Configure URLs:
   - Add your domain: `https://app.cineweave.com`
   - Set redirect URLs
4. Copy your API keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CLERK_JWKS_URL` (from API keys page)
   - `CLERK_ISSUER` (your Clerk domain)

## Step 2: Set Up Convex Database

1. Go to https://convex.dev and create a new project
2. Link to your GitHub repository (optional)
3. Deploy schema and functions:
   ```bash
   cd convex
   npm install
   npx convex dev  # For development
   npx convex deploy  # For production
   ```
4. Seed plans:
   ```bash
   npx convex run plans:seedPlans
   ```
5. Copy deployment URL and admin key:
   - `CONVEX_URL` (from dashboard)
   - `CONVEX_ADMIN_KEY` (from Settings > Environment Variables)

## Step 3: Set Up Cloudflare R2

1. Go to Cloudflare R2 dashboard
2. Create a bucket: `cineweave-outputs`
3. Set lifecycle rule:
   - Delete objects after 1 day (24 hours)
4. Create R2 API token:
   - Go to R2 > Manage R2 API Tokens
   - Create token with Read & Write permissions
5. Copy credentials:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_ENDPOINT_URL`: `https://{account_id}.r2.cloudflarestorage.com`
6. Optional: Set up public domain or use presigned URLs

## Step 4: Set Up RunPod Worker

### Create Network Volume

1. Go to RunPod dashboard > Storage
2. Create Network Volume:
   - Name: `wan22-weights`
   - Size: 20GB
   - Region: Same as your endpoint
3. Upload Wan 2.2 model weights:
   ```bash
   # SSH into a pod with the volume mounted
   # Upload weights to /runpod-volume/wan22/weights/
   ```

### Build and Push Worker Image

```bash
cd worker

# Build Docker image
docker build -t YOUR_DOCKERHUB_USERNAME/cineweave-worker:latest .

# Push to Docker Hub
docker login
docker push YOUR_DOCKERHUB_USERNAME/cineweave-worker:latest
```

### Create Serverless Endpoint

1. Go to RunPod > Serverless
2. Create new endpoint:
   - Container Image: `YOUR_DOCKERHUB_USERNAME/cineweave-worker:latest`
   - GPU Type: H100 (or L40S for lower cost)
   - Network Volume: Select `wan22-weights`
   - Volume Mount Path: `/runpod-volume`
   - Min Workers: 0
   - Max Workers: 10
   - Idle Timeout: 30 seconds
3. Set environment variables:
   - `R2_ACCOUNT_ID`
   - `R2_BUCKET`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_ENDPOINT_URL`
   - `R2_PUBLIC_DOMAIN`
   - `WAN_WEIGHTS_DIR=/runpod-volume/wan22/weights`
   - `WAN_RESOLUTION=720p`
   - `WAN_FPS=24`
4. Copy endpoint details:
   - `RUNPOD_ENDPOINT_ID`
   - `RUNPOD_API_KEY`

## Step 5: Deploy API Gateway to Cloud Run

### Build and Push

```bash
cd gateway

# Authenticate with GCP
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Build and push
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/cineweave-gateway
```

### Deploy to Cloud Run

```bash
gcloud run deploy cineweave-gateway \
  --image gcr.io/YOUR_PROJECT_ID/cineweave-gateway \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --min-instances 1 \
  --memory 512Mi \
  --set-env-vars "ENVIRONMENT=production,CLERK_JWKS_URL=...,CONVEX_URL=...,RUNPOD_ENDPOINT_ID=...,RUNPOD_API_KEY=...,R2_ACCOUNT_ID=...,R2_BUCKET=...,R2_ACCESS_KEY_ID=...,R2_SECRET_ACCESS_KEY=...,R2_PUBLIC_DOMAIN=...,R2_ENDPOINT_URL=...,WEBHOOK_RUNPOD_SECRET=...,APP_BASE_URL=https://app.cineweave.com,CLERK_ISSUER=...,CONVEX_ADMIN_KEY=..."
```

Note: Copy the Cloud Run URL (e.g., `https://cineweave-gateway-xxxxx.run.app`)

## Step 6: Deploy Frontend

### Option A: Vercel (Recommended)

1. Go to https://vercel.com and import your GitHub repository
2. Set root directory to `frontend`
3. Set environment variables:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
   CLERK_SECRET_KEY=...
   NEXT_PUBLIC_CONVEX_URL=...
   NEXT_PUBLIC_API_URL=https://cineweave-gateway-xxxxx.run.app
   NEXT_PUBLIC_APP_URL=https://app.cineweave.com
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
   ```
4. Deploy
5. Set custom domain: `app.cineweave.com`

### Option B: Cloud Run

```bash
cd frontend

# Build for production
npm run build

# Create Dockerfile for Next.js standalone build
# Deploy to Cloud Run similar to gateway
```

## Step 7: Configure RunPod Webhook

In your RunPod serverless endpoint settings:
1. Set webhook URL: `https://cineweave-gateway-xxxxx.run.app/webhooks/runpod`
2. Set webhook secret (same as `WEBHOOK_RUNPOD_SECRET`)

## Step 8: Set Up CI/CD (Optional)

1. Create GitHub repository secrets:
   - `GCP_PROJECT_ID`
   - `GCP_SA_KEY` (service account JSON)
   - `DOCKERHUB_USERNAME`
   - `DOCKERHUB_TOKEN`
   - `CONVEX_DEPLOY_KEY`
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

2. Push to main branch to trigger deployment

## Step 9: TrueLayer Payment Integration (Optional)

1. Create TrueLayer application at https://truelayer.com
2. Enable Payments API
3. Set up webhook endpoint: `https://cineweave-gateway-xxxxx.run.app/webhooks/truelayer`
4. Add environment variables to gateway:
   - `TRUELAYER_CLIENT_ID`
   - `TRUELAYER_CLIENT_SECRET`
   - `TRUELAYER_WEBHOOK_SECRET`
5. Implement payment endpoints in gateway (see PRD for details)

## Step 10: Monitoring and Observability

### Cloud Run (Gateway)
- Enable Cloud Logging
- Set up alerts for:
  - Error rate > 5%
  - Latency > 2s
  - Memory usage > 80%

### RunPod
- Monitor job success rate
- Track cold start times
- Monitor GPU utilization

### Convex
- Monitor database queries
- Track credit consumption
- Monitor failed jobs

### R2
- Monitor storage usage (should stay low with 24h TTL)
- Track upload/download bandwidth

## Production Checklist

- [ ] All environment variables configured
- [ ] Clerk authentication working
- [ ] Convex database deployed and seeded
- [ ] R2 bucket created with lifecycle policy
- [ ] RunPod worker deployed and tested
- [ ] API Gateway deployed to Cloud Run
- [ ] Frontend deployed to Vercel
- [ ] Webhook configured in RunPod
- [ ] Custom domain configured
- [ ] SSL certificates active
- [ ] Monitoring and alerts set up
- [ ] Error tracking configured (Sentry recommended)
- [ ] Rate limiting tested
- [ ] Payment flow tested (if using TrueLayer)

## Testing Production Deployment

1. Sign up for a new account
2. Verify welcome credits are added
3. Create a test video (5s)
4. Monitor job status
5. Verify video downloads
6. Check that video expires after 24 hours
7. Test credit deduction and refunds
8. Test concurrent job limits
9. Verify webhook handling

## Troubleshooting

### Jobs stuck in "queued"
- Check RunPod endpoint is active
- Verify RunPod API credentials
- Check Cloud Run logs for submission errors

### Videos not uploading to R2
- Verify R2 credentials in worker
- Check R2 bucket permissions
- Verify network connectivity from RunPod

### Webhook not working
- Verify webhook URL in RunPod settings
- Check webhook secret matches
- Review Cloud Run logs

### Frontend errors
- Check all NEXT_PUBLIC_* env vars are set
- Verify API_URL is correct
- Check Clerk configuration

## Cost Optimization

- Keep Cloud Run min-instances at 1 for instant responses
- Use RunPod Flex pricing with scale-to-zero
- Monitor R2 storage (should be minimal with 24h TTL)
- Set up budget alerts in GCP
- Monitor RunPod GPU usage and adjust endpoint settings

## Security

- Rotate API keys regularly
- Use secrets manager for sensitive values
- Enable Cloud Armor for DDoS protection
- Implement rate limiting (already in code)
- Regular security audits
- Keep dependencies updated
