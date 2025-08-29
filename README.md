# StoryMagic AI ✨

Minimal, up-to-date README focused on developers working on the monorepo.

## What this repo is
- Mono-repo containing a Vite + React frontend and an Express + TypeScript backend.
- Client lives in `client/` and server code is in `server/`. Shared types and DB schema are in `shared/`.

Quick facts
- Build output (production) is placed in `dist/` by the repository build scripts.
- The project is designed to be deployed as a single service (recommended: Render or Railway) that serves the frontend and backend together.

## Tech stack
- Frontend: React + TypeScript, Vite, Tailwind
- Backend: Node.js + Express + TypeScript
- DB: Supabase (Postgres) with Drizzle schema in `shared/schema.ts`
- Audio/TTS: FFmpeg + ElevenLabs/OpenAI/OpenRouter integrations

## Developer quick start

Prerequisites
- Node.js 18+
- FFmpeg available in PATH (for local audio processing)

Install
```bash
git clone <your-repo-url>
cd storymagic
npm install
```

Environment
- Add server envvars in `server/.env` (example):
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENROUTER_API_KEY, OPENAI_API_KEY, ELEVENLABS_API_KEY
- Client-side env (example) in `client/.env`:
  VITE_API_URL=http://localhost:3000

Run locally (development)
```bash
npm run dev
```
This starts the dev workflow that runs the frontend and backend for local development (see package.json scripts).

Build & type-check
```bash
npm run build
npx tsc -p tsconfig.json
```

Note: for quick verification I recommend running both `npm run build` and `npx tsc` before deploying.

## API surface (short)
- POST /api/story — generate a story from text
- POST /api/pdf-to-story — generate a story from extracted PDF text
- GET /api/stories — list user stories
- GET /api/me — return/create current user (supports `x-user-id` demo header)
- POST /api/story/:id/audio — create audio for a story
- POST /api/upgrade — mark user as premium (MVP flow)

See `server/routes.ts` for full details and input/output shapes.

## Runtime data shape: subscription_end_date
- Current convention (MVP): `subscription_end_date` is stored and passed around as an ISO timestamp string or null (i.e. `string | null`).
- Rationale: Supabase and many transport layers use ISO strings. This minimizes conversion and keeps the MVP scope small. If you later prefer `Date | null`, a coordinated refactor is required across `server/`, `client/`, and fallback storage.

## Deployment recommendation
- For the simplest deployment of this monorepo, deploy as a single web service that runs the bundled `dist/index.js` and serves static assets from `dist/public` (Render, Railway, or similar).

## Helpful commands
- npm run dev — development (frontend + backend)
- npm run build — build client + server into `dist/`
- npx tsc -p tsconfig.json — run TypeScript checks
- npm run lint — run ESLint

## Testing / smoke checks (recommended for MVP)
- Add a simple test or script that:
  - Calls `GET /api/me` and verifies `subscription_end_date` is a string or null.
  - Simulates a LemonSqueezy webhook and asserts the stored `subscription_end_date` is an ISO string.

## Contributing
- Fork → branch → PR. Add tests for non-trivial changes.

## License
- MIT

---
If you'd like, I can also add the two smoke tests and a short developer note about timestamps to the repo now.
- [ ] Story analytics and insights

---

**Made with ✨ by StoryMagic AI Team**





# API Keys - Replace with your actual keys
OPENROUTER_API_KEY="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"
ELEVENLABS_API_KEY="sk_7fa312ca7ee557eb92901f8f9d46f1294aac1cc98d37b544"
OPENAI_API_KEY=your_actual_openai_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Supabase Configuration
# Frontend (Vite) variables
VITE_SUPABASE_URL="https://khpxxahnbckpicxtuldr.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtocHh4YWhuYmNrcGljeHR1bGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNzY5NjgsImV4cCI6MjA2OTg1Mjk2OH0.33LiPpl6zPLBRbr2_KglKsMTQbENgSLfuWTPqWsQxoo"

# Backend (Server) variables
SUPABASE_URL="https://khpxxahnbckpicxtuldr.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtocHh4YWhuYmNrcGljeHR1bGRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI3Njk2OCwiZXhwIjoyMDY5ODUyOTY4fQ.-NTMBxucEWqT17PfYCP0NN5hSHrh6B39v3tbx5K-55Y"


   

DATABASE_URL="postgresql://postgres.khpxxahnbckpicxtuldr:KBB901BDsSYd1WJM@aws-0-eu-north-1.pooler.supabase.com:5432/postgres"       # Postgres connection string from Supabase dashboard

# Environment
NODE_ENV=development

