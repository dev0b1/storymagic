# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Essential Commands
```bash
# Install dependencies
npm install

# Start development servers (both frontend and backend)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run check

# Database operations
npm run db:push
```

### Development Server Details
- **Frontend**: Runs on port 5173 (Vite dev server)
- **Backend**: Runs on port 3000 (Express server)
- **Proxy**: Frontend proxies `/api` requests to backend automatically

### Testing Individual Components
```bash
# Test specific API endpoint
curl -X POST http://localhost:3000/api/story \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user" \
  -d '{"inputText": "test content", "narrationMode": "balanced"}'

# Check database health
curl http://localhost:3000/api/health/db

# Check Supabase connectivity
curl http://localhost:3000/api/health/supabase
```

## System Architecture

### High-Level Data Flow
1. **Input Processing**: Text/PDF → Content analysis → AI prompt generation
2. **Story Generation**: OpenRouter API (Mistral AI) → Generated story → Database storage
3. **Audio Production**: Story → TTS (ElevenLabs/OpenAI) → Background music mixing → Final audio

### Core Technology Stack
- **Frontend**: React 18 + TypeScript, Vite, Tailwind CSS, Radix UI components
- **Backend**: Express.js + TypeScript, Supabase integration
- **Database**: PostgreSQL (Supabase) with Drizzle ORM
- **AI Services**: OpenRouter API for story generation, ElevenLabs/OpenAI for TTS
- **Audio Processing**: FFmpeg for mixing TTS with background music

### Project Structure
```
storymagic/
├── client/src/           # React frontend
│   ├── components/       # UI components (story display, audio controls)
│   ├── pages/           # Application pages (dashboard, landing, auth)
│   └── lib/             # Client services (auth, API clients)
├── server/              # Express backend
│   ├── routes.ts        # All API endpoints and business logic
│   ├── supabase.ts      # Database operations wrapper
│   └── config.ts        # Configuration management
├── shared/              # Common TypeScript types and schemas
└── database_setup.sql   # Database schema and policies
```

## Key API Endpoints

### Story Generation
- `POST /api/story` - Generate story from text input
- `POST /api/upload-pdf` - Process PDF file and generate story
- `POST /api/story/:id/audio` - Generate TTS audio with optional background music

### User Management
- `GET /api/me` - Get/create current user
- `GET /api/stories` - User's story history
- `POST /api/demo-login` - Create demo user session

### Health Checks
- `GET /api/health/db` - Database wrapper health
- `GET /api/health/supabase` - Direct Supabase connectivity

## Environment Configuration

### Required Variables
```bash
# AI Services
OPENROUTER_API_KEY=sk-or-v1-your_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here
OPENAI_API_KEY=sk-your_openai_key_here

# Database (Supabase)
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://...

# Client Environment
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Configuration Validation
The system validates API keys on startup. Check `server/config.ts` for key validation logic.

## Database Schema

### Core Tables
- **users**: User accounts, premium status, story generation counts
- **stories**: Generated stories with metadata (narration mode, content type, source)

### Database Setup
Run the SQL in `database_setup.sql` in your Supabase SQL editor to create tables, indexes, RLS policies, and triggers.

## Audio System Architecture

### TTS Priority Chain
1. **ElevenLabs** (Premium quality) - Used for premium features
2. **OpenAI TTS** (High quality fallback) - Good reliability
3. **Browser TTS** (Client-side fallback) - For demo users

### Background Music
- Generated using FFmpeg with character-specific audio profiles
- Different sound profiles for each narration mode (focus, balanced, engaging)
- Custom audio files can be added in `assets/audio/backgrounds/`

## Narration Modes

### Available Modes
- **Focus**: Professional lecture-style delivery for technical content
- **Balanced**: Friendly, conversational explanations (default)
- **Engaging**: Narrative storytelling while preserving accuracy
- **Doc Theatre**: Multi-voice podcast format with SFX cues

### Prompt Engineering
Adaptive prompts in `server/routes.ts` adjust AI behavior based on narration mode and content type.

## User Limits & Premium Features

### Free Users
- 10 stories per session
- 600 character input limit
- 5MB PDF uploads
- Browser TTS only

### Premium Users
- Unlimited stories
- 20,000 character limit
- 20MB PDF uploads
- ElevenLabs premium voices

## Development Considerations

### Error Handling
- Comprehensive error boundaries in React components
- API error responses include actionable messages
- Fallback systems for all external services

### Authentication
- Demo user system for testing (`demo@gmail.com`)
- Supabase integration for production auth
- Session management via localStorage

### File Processing
- PDF parsing with `pdf-parse` library
- File upload handling via multer
- Content type detection for optimal story generation

## Common Development Tasks

### Adding New Narration Modes
1. Update `narrationModes` object in `server/routes.ts`
2. Add corresponding audio profile in background music generation
3. Update frontend mode selection UI

### Modifying TTS Providers
1. Update TTS priority logic in `server/routes.ts`
2. Add new provider functions following existing patterns
3. Update configuration validation in `server/config.ts`

### Database Schema Changes
1. Update `shared/schema.ts` for TypeScript types
2. Create migration in Supabase dashboard
3. Update API endpoints to handle new fields

## Deployment Notes

### Production Requirements
- FFmpeg must be installed and available in PATH
- All environment variables properly configured
- Supabase RLS policies enabled for security
- Rate limiting recommended for production use

### Build Process
- Frontend builds to `dist/public/`
- Backend bundles with esbuild to `dist/`
- Single command deployment: `npm run build && npm start`
