# RunPod + Wan 2.2 Model Setup Guide

Complete step-by-step guide to deploying CineWeave worker on RunPod with the Wan 2.2-TI2V-5B model.

---

## Prerequisites

- RunPod account with payment method
- Wan 2.2 model weights (see Part A below)
- Docker installed locally (for building worker image)
- Docker Hub account (for hosting worker image)

**Estimated Time:** 2-4 hours (plus model download time)
**Estimated Cost:** $0.50-$2 for testing, then pay-per-use in production

---

## Part A: Obtain Wan 2.2 Model Weights

### Step 1: Find the Model

The Wan 2.2-TI2V-5B model is likely available through one of these sources:

**Option 1: Hugging Face** (most common)
1. Go to https://huggingface.co/models
2. Search for: `wan 2.2`, `wan-animate`, or `wand-ai`
3. Look for model repos like:
   - `wand-ai/wan-2-2-ti2v-5b`
   - `WandLabs/wan-2.2-ti2v`
   - Or similar naming

**Option 2: GitHub**
1. Check https://github.com/wand-ai
2. Look for official model releases or download links

**Option 3: Official Wan Website**
1. Visit official Wan AI website (if available)
2. Check for model downloads or API access

### Step 2: Check Access Requirements

Once you find the model:

1. **Check the license:**
   - Is it open source (MIT, Apache)?
   - Does it allow commercial use?
   - Do you need to accept terms?

2. **Check access requirements:**
   - Some models require manual approval
   - You may need to describe your use case
   - Approval can be instant or take 1-24 hours

3. **Check model size:**
   - Should be ~5-20 GB for the 5B parameter version
   - Ensure you have enough disk space

### Step 3: Get Hugging Face Token (if needed)

If the model requires authentication:

1. Go to https://huggingface.co/settings/tokens
2. Click "New token"
3. Name it: `cineweave-model-access`
4. Type: **Read**
5. Click "Generate"
6. **Save this token** - you'll need it later!

---

## Part B: Set Up RunPod Infrastructure

### Step 1: Create RunPod Account

1. Go to https://www.runpod.io/
2. Click "Sign Up"
3. Use GitHub, Google, or email
4. Verify your email address

### Step 2: Add Payment Method

1. Click your profile icon (top right)
2. Go to "Billing"
3. Click "Add Credit Card"
4. Add your payment details
5. Add at least **$10 credit** to start

**Pricing Guide:**
- **H100 GPU**: ~$2.79/hour (fastest, overkill for testing)
- **L40S GPU**: ~$0.79/hour (best balance for production)
- **RTX 4090**: ~$0.39/hour (good for testing)
- **Network Storage**: ~$0.10/GB/month

For testing, you'll spend about $0.50-$2 total.

### Step 3: Create Network Volume for Model Storage

Your model weights need persistent storage attached to your serverless endpoint.

1. In RunPod dashboard, click **"Storage"** in left sidebar
2. Click **"+ New Network Volume"**
3. Configure:
   - **Name**: `wan-model-weights`
   - **Size**: **25 GB** (gives room for model + dependencies)
   - **Data Center**: Choose closest to you:
     - `US-CA-1` (California)
     - `US-OR-1` (Oregon)
     - `EU-NL-1` (Netherlands)
     - `EU-RO-1` (Romania - cheapest)
4. Click **"Create"**

**Cost:** ~$2.50/month for 25GB

5. **Note the Volume ID** - you'll need this later!

### Step 4: Download Model to Network Volume

We'll use a temporary GPU Pod to download and store the model:

#### 4a. Deploy Temporary Pod

1. Click **"Pods"** in left sidebar
2. Click **"Deploy"** → **"GPU Pod"**
3. Select GPU:
   - **GPU Type**: RTX 4090 (cheapest for downloads, ~$0.39/hr)
   - You only need this for ~15-30 minutes
4. Select Container Image:
   - **Template**: PyTorch 2.1 or similar
   - Or use: `runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel`
5. **Attach Volume**:
   - Toggle "Attach Network Volume"
   - Select `wan-model-weights` from dropdown
   - Mount path: `/workspace` (default)
6. Click **"Deploy On-Demand"**

Wait ~1-2 minutes for pod to start.

#### 4b. Connect to Pod Terminal

1. Find your pod in the Pods dashboard
2. Click **"Connect"** button
3. Select **"Start Web Terminal"** or **"Connect with SSH"**

You should see a terminal interface.

#### 4c. Download the Model

In the pod terminal, run these commands:

```bash
# Navigate to the mounted volume
cd /workspace

# Create directory structure
mkdir -p wan22/weights

# Update pip and install Hugging Face CLI
pip install --upgrade pip
pip install huggingface_hub

# Login to Hugging Face (if model requires auth)
huggingface-cli login
# Paste your HF token when prompted, then press Enter

# Download the model
# REPLACE 'wand-ai/wan-2-2-ti2v-5b' with the actual model repo you found
huggingface-cli download wand-ai/wan-2-2-ti2v-5b \
  --local-dir /workspace/wan22/weights \
  --local-dir-use-symlinks False

# This will take 10-30 minutes depending on model size and internet speed
```

**Alternative: Download specific files only**

If the model repo has many files, you can download specific ones:

```bash
# Download just the essential model files
huggingface-cli download wand-ai/wan-2-2-ti2v-5b \
  --include "*.safetensors" "*.json" "*.txt" \
  --local-dir /workspace/wan22/weights
```

#### 4d. Verify Download

```bash
# Check what was downloaded
ls -lh /workspace/wan22/weights

# Check total size
du -sh /workspace/wan22/weights

# Expected output: Should show model files totaling 5-20 GB
```

You should see files like:
- `model.safetensors` or `pytorch_model.bin`
- `config.json`
- `model_index.json`
- Other configuration files

#### 4e. Stop the Pod

**IMPORTANT:** Stop the pod immediately to avoid charges!

1. Go back to Pods dashboard
2. Find your pod
3. Click the **three dots** (⋮) menu
4. Click **"Terminate Pod"**

Your model is now safely stored in the Network Volume and won't incur GPU charges!

---

## Part C: Build and Push Worker Docker Image

### Step 1: Create Docker Hub Repository

1. Go to https://hub.docker.com/
2. Sign in or create account
3. Click "Create Repository"
4. Name it: `cineweave-worker`
5. Set to **Public** (or Private if you prefer)
6. Click "Create"

### Step 2: Replace Handler with Real Implementation

On your local machine, in the `~/Cineweave/worker/` directory:

```bash
cd ~/Cineweave/worker

# Backup the placeholder handler
mv handler.py handler_placeholder.py

# Use the real implementation
mv handler_real.py handler.py
```

This replaces the placeholder code with the actual Wan 2.2 integration.

### Step 3: Update Dockerfile (if needed)

The existing Dockerfile should work, but verify it's correct:

```bash
# View the Dockerfile
cat Dockerfile
```

It should look similar to this (already created):

```dockerfile
FROM runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY handler.py .
COPY .env.example .env

# Create output directory
RUN mkdir -p /workspace/out

# RunPod serverless endpoint
CMD ["python", "-u", "-c", "import runpod; from handler import handler; runpod.serverless.start({'handler': handler})"]
```

### Step 4: Build Docker Image

```bash
# Build the image (replace 'yourusername' with your Docker Hub username)
docker build -t yourusername/cineweave-worker:latest .

# This will take 5-10 minutes
```

### Step 5: Push to Docker Hub

```bash
# Login to Docker Hub
docker login

# Push the image
docker push yourusername/cineweave-worker:latest

# This will take 5-15 minutes depending on your internet speed
```

---

## Part D: Create RunPod Serverless Endpoint

### Step 1: Go to Serverless Section

1. In RunPod dashboard, click **"Serverless"** in left sidebar
2. Click **"+ New Endpoint"**

### Step 2: Configure Endpoint

**Basic Settings:**
- **Endpoint Name**: `cineweave-video-gen`
- **Select Your Docker Image**:
  - Choose "Custom" or "Docker Hub"
  - Enter: `yourusername/cineweave-worker:latest`

**GPU Configuration:**
- **GPU Type**: Select `L40S` or `RTX 4090` (good balance of cost and performance)
- **Workers**: Start with `0` (scales automatically)
- **Max Workers**: Set to `3` (adjust based on expected load)
- **Idle Timeout**: `5` seconds
- **Execution Timeout**: `600` seconds (10 minutes - enough for 15-sec video)

**Container Configuration:**
- **Container Disk Size**: `20 GB`
- **Volume Mount Path**: `/runpod-volume` (this is where your model weights will be)
- **Select Network Volume**: Choose `wan-model-weights` from dropdown

**Environment Variables:**

Add these environment variables (click "+ Add Environment Variable" for each):

| Name | Value |
|------|-------|
| `R2_ACCOUNT_ID` | `0681fbcbe78d97ddc0600e26eb3034cc` |
| `R2_BUCKET` | `cineweave-outputs` |
| `R2_ACCESS_KEY_ID` | `f03a94fc9cc4e9a700e558af4380e60d` |
| `R2_SECRET_ACCESS_KEY` | `ec96e62953587b780fb8a57f0ecc9fcdcde4d55ea2053921c309dc1f4cec161e` |
| `R2_ENDPOINT_URL` | `https://0681fbcbe78d97ddc0600e26eb3034cc.r2.cloudflarestorage.com` |
| `R2_PUBLIC_DOMAIN` | `https://pub-b50a9a46bd634aeda4c8727ad0176fc3.r2.dev` |
| `WAN_WEIGHTS_DIR` | `/runpod-volume/wan22/weights` |
| `WAN_RESOLUTION` | `720p` |
| `WAN_FPS` | `24` |
| `LOG_LEVEL` | `INFO` |

### Step 3: Advanced Settings (Optional)

- **Active Workers**: `0` (workers spin up on demand)
- **GPUs Per Worker**: `1`
- **Flash Boot**: Enable (faster startup)

### Step 4: Create Endpoint

1. Review all settings
2. Click **"Deploy"**
3. Wait ~2-3 minutes for endpoint to be ready

### Step 5: Get Endpoint Credentials

Once deployed, you'll see:

1. **Endpoint ID**: Something like `abc123xyz456`
2. **API Key**: Click "Show API Key" to reveal

**Save both of these** - you'll need them next!

---

## Part E: Update Gateway Configuration

Now update your local API gateway with the real RunPod credentials:

```bash
# Edit the gateway .env file
# (You can use any text editor)
nano ~/Cineweave/gateway/.env
```

Update these lines:

```env
# Replace these mock values with real ones:
RUNPOD_ENDPOINT_ID=abc123xyz456  # Your actual endpoint ID
RUNPOD_API_KEY=YOUR_RUNPOD_API_KEY  # Your actual API key
RUNPOD_API_URL=https://api.runpod.ai/v2  # Keep this as-is
```

Save and close the file.

---

## Part F: Test the Complete System

### Step 1: Start Local Services

**Terminal 1 - API Gateway:**

```bash
cd ~/Cineweave/gateway

# Activate virtual environment (create if needed)
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the API
uvicorn main:app --reload --port 8080
```

Wait for: `Uvicorn running on http://127.0.0.1:8080`

**Terminal 2 - Frontend:**

```bash
cd ~/Cineweave/frontend

# Install dependencies (if not done already)
npm install

# Start development server
npm run dev
```

Wait for: `Ready on http://localhost:3000`

### Step 2: Test Video Generation

1. Open browser to http://localhost:3000
2. Click "Get Started" or "Sign In"
3. Create an account or sign in
4. You should see your dashboard with **80 credits**
5. Click "Create Video" in the navbar
6. Enter a test prompt:
   ```
   A majestic eagle soaring through mountain peaks at sunset
   ```
7. Select **5 seconds** duration (costs 1 credit)
8. Leave CFG at 7.5
9. Click **"Generate Video"**

### Step 3: Monitor Progress

You should see:

1. **Frontend**: "Job submitted! Redirecting to job viewer..."
2. **Job Page**: Shows status updating in real-time:
   - `PENDING` → `PROCESSING` → `COMPLETED`
3. **RunPod Dashboard**: Go to your endpoint, you should see:
   - Active workers spinning up
   - Job in progress
4. **Gateway Terminal**: Watch logs showing webhook received
5. **Credits**: Should decrease from 80 to 79

### Step 4: View Results

Once status shows `COMPLETED`:

1. Video player appears with your generated video
2. Click **Download** to save it
3. Check R2 bucket to see the uploaded file

### Step 5: Verify Everything Works

Run through this checklist:

- ✅ Video generation completes successfully
- ✅ Credits deducted correctly (1 credit per 5 seconds)
- ✅ Video appears in R2 bucket
- ✅ Video plays in browser
- ✅ Download works
- ✅ Job status updates in real-time
- ✅ RunPod worker scales up and down automatically

---

## Part G: Production Deployment (Optional)

Once everything works locally, you can deploy to production:

1. **Deploy API Gateway to Google Cloud Run** (follow DEPLOYMENT.md)
2. **Update Frontend Environment Variables** with production API URL
3. **Deploy Frontend to Vercel** or similar
4. **Update RunPod Webhook URL** to point to production gateway

See the main **DEPLOYMENT.md** file for detailed production deployment instructions.

---

## Troubleshooting

### Issue: Model fails to load

**Symptoms:** Worker logs show "Failed to load model"

**Solutions:**
1. Verify model files exist in Network Volume:
   - Deploy temporary pod with volume attached
   - Check `/workspace/wan22/weights` directory
2. Check model format is compatible with `diffusers` library
3. Verify you have enough GPU memory (need 16GB+ VRAM for 5B model)

### Issue: "Out of memory" errors

**Symptoms:** Worker crashes with CUDA out of memory

**Solutions:**
1. Enable memory optimizations in handler_real.py (already included)
2. Use a larger GPU:
   - Try L40S (48GB VRAM) instead of RTX 4090 (24GB)
   - Or use H100 (80GB VRAM) for guaranteed fit
3. Reduce resolution to 480p temporarily

### Issue: Video generation takes too long

**Symptoms:** Jobs timeout after 10 minutes

**Solutions:**
1. Reduce `num_inference_steps` in handler.py (try 30 instead of 50)
2. Use faster GPU (H100)
3. Increase `Execution Timeout` in RunPod endpoint settings

### Issue: Webhook not received

**Symptoms:** Jobs stuck in PROCESSING state forever

**Solutions:**
1. Check gateway logs for webhook errors
2. Verify `WEBHOOK_RUNPOD_SECRET` matches in both gateway and RunPod
3. Ensure gateway is publicly accessible (use ngrok for local testing)
4. Check RunPod webhook URL configuration

### Issue: Videos not uploading to R2

**Symptoms:** Job completes but no video in R2

**Solutions:**
1. Verify R2 credentials are correct in RunPod environment variables
2. Check worker logs for R2 upload errors
3. Test R2 access manually with AWS CLI
4. Verify bucket name and endpoint URL are correct

---

## Cost Estimates

### Development/Testing:
- Network Volume (25GB): **$2.50/month**
- GPU usage (testing): **$0.50-$2 total** (pay per second)
- R2 Storage: **Free** (under 10GB)
- Total first month: **~$5**

### Production (low volume):
- 100 videos/month (5 seconds each)
- L40S at $0.79/hour
- ~30 seconds per video = **$0.0066 per video**
- 100 videos = **$0.66/month** in GPU costs
- Network Volume: **$2.50/month**
- Total: **~$3-4/month**

### Production (high volume):
- 10,000 videos/month
- GPU costs: **$66/month**
- Network Volume: **$2.50/month**
- R2 bandwidth (>10GB): **~$4/month**
- Total: **~$73/month**

Compare to your revenue at $0.10 per credit (5 seconds):
- 10,000 videos = 10,000 credits = **$1,000 revenue**
- Costs: **$73**
- Gross margin: **93%** 🚀

---

## Next Steps

Once RunPod is working:

1. ✅ Test with various prompts (landscapes, people, abstract)
2. ✅ Test image-to-video feature
3. ✅ Verify different durations (5s, 10s, 15s)
4. ✅ Test credit system and refunds on failures
5. ✅ Set up TrueLayer for real payments
6. ✅ Deploy to production
7. ✅ Launch! 🚀

---

**Questions or Issues?**

If you encounter any problems:
1. Check RunPod dashboard logs
2. Check gateway terminal logs
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly
5. Ensure model files are in the correct location on Network Volume

**Good luck with your RunPod setup!** 🎬
