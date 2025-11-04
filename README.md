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

## Architecture

```
Web App (React/Next.js) → API Gateway (Cloud Run/FastAPI) → RunPod Serverless (H100)
         ↓                         ↓                              ↓
    Clerk Auth                 Convex DB                    Cloudflare R2
                            TrueLayer Payments
```

## Tech Stack

- **Frontend**: React/Next.js with Clerk authentication
- **API Gateway**: FastAPI on Google Cloud Run
- **Compute**: RunPod Serverless (H100 GPUs + Network Volume)
- **Database**: Convex
- **Storage**: Cloudflare R2 (24h lifecycle)
- **Auth**: Clerk
- **Payments**: TrueLayer (Open Banking)

## Repository Structure

```
/frontend   - Next.js web application
/gateway    - FastAPI API gateway (Cloud Run)
/worker     - FastAPI handler for RunPod inference
/convex     - Convex database schema and functions
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Docker (for worker development)
- Accounts: Clerk, Convex, RunPod, Cloudflare R2, TrueLayer

### Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd Cineweave
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   # Configure environment variables
   npm run dev
   ```

3. **API Gateway Setup**
   ```bash
   cd gateway
   python -m venv venv
   source venv/bin/activate  # or `venv\Scripts\activate` on Windows
   pip install -r requirements.txt
   cp .env.example .env
   # Configure environment variables
   uvicorn main:app --reload
   ```

4. **Convex Setup**
   ```bash
   cd convex
   npm install
   npx convex dev
   ```

5. **Worker Setup**
   ```bash
   cd worker
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   # See worker/README.md for Docker build instructions
   ```

## Development

See individual README files in each directory for detailed development instructions:

- [Frontend README](./frontend/README.md)
- [Gateway README](./gateway/README.md)
- [Worker README](./worker/README.md)
- [Convex README](./convex/README.md)

## Pricing

- **Starter**: 80 credits/mo - $10
- **Creator**: 250 credits/mo - $31
- **Studio**: 500 credits/mo - $60

Credits: 1 credit = 5 seconds of video

## Performance Targets

- Average render time (5s clip): ≤ 1 minute on H100
- Cold start latency: < 10 seconds
- API response: < 300ms
- Storage lifecycle: 24h auto-deletion

## Security

- All API requests verified with Clerk JWT
- RunPod webhooks verified with shared secret
- Signed R2 URLs with 24h expiry
- Rate limiting: max 5 concurrent jobs per user

## License

[Add your license here]

## Support

For issues and questions, please open an issue on GitHub.
