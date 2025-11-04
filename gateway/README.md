# CineWeave API Gateway

FastAPI-based API gateway that mediates between the web app and RunPod inference workers.

## Tech Stack

- FastAPI
- Python 3.11
- Clerk (JWT validation)
- Convex (database client)
- RunPod API
- Cloudflare R2 (boto3)

## Getting Started

1. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Update `.env` with your credentials.

4. **Run development server**
   ```bash
   uvicorn main:app --reload
   ```

   API docs available at [http://localhost:8000/docs](http://localhost:8000/docs)

## Available Scripts

- `uvicorn main:app --reload` - Start dev server with hot reload
- `pytest` - Run tests
- `pytest --cov` - Run tests with coverage
- `black .` - Format code
- `ruff check .` - Lint code

## Project Structure

```
gateway/
├── main.py              # FastAPI app and routes
├── auth.py              # Clerk JWT verification
├── convex_client.py     # Convex database operations
├── runpod_client.py     # RunPod API client
├── r2_client.py         # Cloudflare R2 operations
├── models.py            # Pydantic models
├── config.py            # Settings and configuration
└── tests/               # Test files
```

## API Endpoints

### POST /jobs/create
Create a new video generation job.

**Request:**
```json
{
  "prompt": "A silver drone flies through neon skyline",
  "imageUrl": null,
  "durationSec": 5,
  "seed": 42
}
```

**Response:**
```json
{
  "jobId": "job_abc123"
}
```

### GET /jobs/{id}
Get job status and video URL.

**Response:**
```json
{
  "status": "done",
  "r2Url": "https://r2.cdn/.../abc123.mp4",
  "expiresAt": "2025-11-05T12:30:00Z",
  "durationSec": 5
}
```

### POST /webhooks/runpod
RunPod completion webhook (internal endpoint).

**Headers:**
- `X-RunPod-Signature`: HMAC signature for verification

### GET /credits
Get user's remaining credits.

**Response:**
```json
{
  "credits": 75,
  "plan": "starter"
}
```

## Authentication

All endpoints (except webhooks) require a valid Clerk JWT in the Authorization header:

```
Authorization: Bearer <clerk_jwt_token>
```

The gateway verifies the JWT using Clerk's JWKS endpoint.

## Deployment

### Cloud Run

1. **Build Docker image**
   ```bash
   docker build -t gcr.io/PROJECT_ID/cineweave-gateway .
   ```

2. **Push to Google Container Registry**
   ```bash
   docker push gcr.io/PROJECT_ID/cineweave-gateway
   ```

3. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy cineweave-gateway \
     --image gcr.io/PROJECT_ID/cineweave-gateway \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --min-instances 1
   ```

4. **Set environment variables** in Cloud Run console

## Security

- JWT verification on all user-facing endpoints
- RunPod webhook signature verification
- Rate limiting (max 5 concurrent jobs per user)
- Input validation and sanitization
- Signed R2 URLs with 24h expiry

## Error Handling

The API returns standardized error responses:

```json
{
  "detail": "Insufficient credits",
  "code": "INSUFFICIENT_CREDITS"
}
```

Common status codes:
- 200: Success
- 400: Bad request (invalid input)
- 401: Unauthorized (invalid/missing JWT)
- 402: Payment required (insufficient credits)
- 429: Too many requests (rate limit)
- 500: Internal server error

## Testing

Run tests:
```bash
pytest
```

With coverage:
```bash
pytest --cov=. --cov-report=html
```

## Monitoring

Monitor these metrics in production:
- Request latency (p50, p95, p99)
- Error rates (4xx, 5xx)
- RunPod job success rate
- Credit consumption rate
- R2 upload/download latency
