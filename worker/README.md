# CineWeave Worker

RunPod Serverless worker for video generation using Wan 2.2-TI2V-5B model.

## Tech Stack

- Python 3.11
- PyTorch + CUDA
- Wan 2.2-TI2V-5B (text/image to video)
- FastAPI (handler endpoint)
- Cloudflare R2 (output storage)
- RunPod Serverless

## Overview

This worker:
1. Receives job requests from RunPod Serverless API
2. Loads Wan 2.2 model from Network Volume
3. Generates 720p/24fps video (5-15 seconds)
4. Uploads MP4 to Cloudflare R2
5. Returns video URL and metadata

## Getting Started

### Local Development

1. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Download model weights** (for local testing)
   ```bash
   # Download Wan 2.2-TI2V-5B weights
   # Place in directory specified by WAN_WEIGHTS_DIR
   ```

5. **Run handler**
   ```bash
   python handler.py
   ```

### Docker Build

Build the Docker image:

```bash
docker build -t cineweave-worker:latest .
```

Test locally with GPU:

```bash
docker run --gpus all -p 8000:8000 \
  -e R2_ACCESS_KEY_ID=xxx \
  -e R2_SECRET_ACCESS_KEY=xxx \
  cineweave-worker:latest
```

## RunPod Deployment

### 1. Create Network Volume

Create a Network Volume in the same region as your endpoint to store model weights (~10-15 GB).

```bash
# Upload weights to Network Volume
# Mount path: /runpod-volume
# Place weights at: /runpod-volume/wan22/weights/
```

### 2. Push Docker Image

```bash
# Tag image
docker tag cineweave-worker:latest <your-dockerhub>/cineweave-worker:latest

# Push to Docker Hub or GHCR
docker push <your-dockerhub>/cineweave-worker:latest
```

### 3. Create Serverless Endpoint

1. Go to RunPod Dashboard → Serverless
2. Create new endpoint
3. Configure:
   - **Container Image**: `<your-dockerhub>/cineweave-worker:latest`
   - **GPU Type**: H100 (or L40S for lower cost)
   - **Network Volume**: Select your volume with weights
   - **Min Workers**: 0 (scale to zero when idle)
   - **Max Workers**: 10 (adjust based on demand)
   - **Idle Timeout**: 30 seconds
   - **Environment Variables**: Add R2 credentials

### 4. Test Endpoint

```bash
curl -X POST https://api.runpod.ai/v2/<ENDPOINT_ID>/run \
  -H "Authorization: Bearer <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "prompt": "A drone flies through a neon cityscape",
      "durationSec": 5,
      "seed": 42
    }
  }'
```

## Handler API

### POST /run

Input payload:
```json
{
  "prompt": "A silver drone flies through neon skyline",
  "imageUrl": null,
  "durationSec": 5,
  "seed": 42
}
```

Output:
```json
{
  "r2Url": "https://pub-xxxxx.r2.dev/outputs/abc123.mp4",
  "durationSec": 5,
  "seed": 42,
  "frameCount": 120,
  "resolution": "1280x720"
}
```

## Model Configuration

**Model**: Wan 2.2-TI2V-5B
**Resolution**: 720p (1280x720)
**Frame Rate**: 24 fps
**Durations**: 5s (120 frames), 10s (240 frames), 15s (360 frames)

### Inference Settings

- **CFG Scale**: 7.0-10.0 (adjustable)
- **Sampling Steps**: 50-100
- **Scheduler**: DDIM or DPM-Solver++
- **Precision**: FP16 (for speed)

## Performance Optimization

### GPU Memory Management

- Load model once and cache in VRAM
- Use `torch.cuda.empty_cache()` between jobs if needed
- Enable `torch.compile()` for faster inference (PyTorch 2.0+)

### Cold Start Reduction

- Network Volume: Pre-load weights (~5-10s startup)
- Keep 1 warm worker during peak hours
- Use smaller batch size if memory constrained

### Expected Performance

| Duration | Frames | H100 Time | L40S Time |
|----------|--------|-----------|-----------|
| 5s       | 120    | ~60s      | ~120s     |
| 10s      | 240    | ~120s     | ~240s     |
| 15s      | 360    | ~180s     | ~360s     |

## R2 Upload

Videos are uploaded to Cloudflare R2 with:
- Key format: `outputs/<uuid>.mp4`
- Content-Type: `video/mp4`
- Lifecycle: 24-hour auto-deletion

## Error Handling

The handler returns errors in this format:

```json
{
  "error": "Failed to generate video",
  "detail": "CUDA out of memory",
  "code": "GPU_OOM"
}
```

Common errors:
- `GPU_OOM`: Reduce batch size or resolution
- `MODEL_LOAD_FAILED`: Check weights path and permissions
- `R2_UPLOAD_FAILED`: Verify R2 credentials
- `INVALID_INPUT`: Check prompt length and image format

## Monitoring

Key metrics to track:
- Cold start time (model load)
- Inference time per duration
- GPU utilization
- Memory usage
- Upload time to R2
- Success/failure rate

## Logging

Logs are structured JSON for easy parsing:

```json
{
  "timestamp": "2025-11-04T12:00:00Z",
  "level": "INFO",
  "job_id": "abc123",
  "event": "generation_complete",
  "duration_sec": 5,
  "inference_time": 58.3
}
```

## Troubleshooting

### Model won't load
- Verify `WAN_WEIGHTS_DIR` path
- Check Network Volume is mounted
- Ensure weights are compatible with PyTorch version

### Slow inference
- Check GPU type (H100 vs L40S)
- Reduce sampling steps
- Enable torch.compile()

### R2 upload fails
- Verify R2 credentials
- Check bucket name and permissions
- Test with `boto3` directly

### Out of memory
- Reduce batch size
- Use FP16 precision
- Clear cache between jobs

## Development Tips

- Use `torch.cuda.amp` for mixed precision
- Profile with `torch.profiler` to find bottlenecks
- Test with short videos first (5s)
- Monitor VRAM usage with `nvidia-smi`
