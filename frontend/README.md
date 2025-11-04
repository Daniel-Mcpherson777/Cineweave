# CineWeave Frontend

Next.js web application for CineWeave video generation platform.

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Clerk (Authentication)
- Convex (Real-time data)

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your credentials:
   - Clerk keys from https://dashboard.clerk.com
   - Convex URL from `npx convex dev`
   - API Gateway URL

3. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

## Project Structure

```
src/
├── app/              # Next.js app router pages
│   ├── dashboard/    # Dashboard page
│   ├── create/       # Video creation page
│   ├── jobs/         # Job viewer
│   └── account/      # Account settings
├── components/       # Reusable React components
├── lib/             # Utilities and helpers
└── styles/          # Global styles
```

## Key Features

- **Authentication**: Clerk-based OAuth with email/password and social login
- **Dashboard**: View credits, recent jobs, and quick actions
- **Create Page**: Text prompt input, image upload, duration selector (5/10/15s)
- **Job Viewer**: Real-time status updates, video preview, download
- **Account**: Billing management, credit history, profile settings

## Theme

Purple, red, and blue gradient palette for a cinematic feel. Configure in `tailwind.config.js`.

## API Integration

All API calls go through the API Gateway URL configured in `NEXT_PUBLIC_API_URL`:

- `POST /jobs/create` - Create new video generation job
- `GET /jobs/:id` - Get job status and video URL
- `GET /credits` - Fetch user's remaining credits

## Deployment

Deploy to Vercel or Cloud Run:

```bash
npm run build
```

Set environment variables in your deployment platform.
