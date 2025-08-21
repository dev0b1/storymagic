# StoryMagic AI ✨

Transform boring PDFs and text into immersive, narrated stories with professional AI storytelling and ambient audio.

## 🚀 Features

### 📄 PDF to Story Conversion
- **Upload any PDF** and transform it into engaging, narrated content
- **Content Type Detection** - AI automatically detects academic, business, technical, historical, or creative content
- **Adaptive Storytelling** - Professional narration modes based on content type
- **Educational Output** - Meaningful, context-aware stories that preserve factual accuracy

### 🎭 Narration Modes
- **📚 Focus**: Crystal-clear, precise delivery. For technical and academic content.
- **⚖️ Guide (Balanced)**: Friendly, informative, conversational.
- **💫 Storyteller (Engaging)**: Narrative storytelling while maintaining accuracy.
- **🎭 Doc Theatre**: Multi-voice drama/debate/story based on the document. Includes subtle [SFX:] and [BG:] cues, interruptions (—) and overlapping (overlapping) markers.

### 🎵 Immersive Audio Experience
- **Dynamic Background Music** - Ambient sounds that adapt to narration mode
- **Multiple TTS Providers** - ElevenLabs (premium), OpenAI, and browser synthesis
- **Toggle Controls** - Turn ambient audio on/off as needed
- **Audio Download** - Save stories as MP3 files with background music

### 🎨 Enhanced UI/UX
- **Beautiful Landing Page** - Showcases all features with interactive demos
- **Professional Design** - Modern, clean interface with subtle animations
- **Responsive Layout** - Works perfectly on desktop and mobile
- **Streamlined PDF Upload** - Simple icon button under text input

### 💾 Persistent Storage
- **Supabase Database** - Real user data and story history
- **User Management** - Track story generation limits and preferences
- **Story History** - Access and replay previous stories
- **Premium Features** - Pro user limits and capabilities

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Radix UI** + shadcn/ui components
- **Wouter** for routing
- **React Query** for data fetching
- **Web Audio API** for ambient sounds

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Supabase** for database and user management
- **OpenRouter API** for AI story generation
- **FFmpeg** for audio processing
- **ElevenLabs + OpenAI** for TTS

### AI & Audio
- **Mistral AI** models for story generation
- **ElevenLabs** for premium TTS voices
- **OpenAI TTS** as fallback
- **Browser Speech Synthesis** for demo users
- **FFmpeg** for audio mixing and background music

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- FFmpeg installed and in PATH
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd storymagic
   ```

2. **Install dependencies**
```bash
npm install
   ```

3. **Set up environment variables**

   **`server/.env`:**
   ```env
   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # AI APIs
   OPENROUTER_API_KEY=your_openrouter_api_key
   OPENAI_API_KEY=your_openai_api_key

   # TTS APIs
   ELEVENLABS_API_KEY=your_elevenlabs_api_key

   # Optional
   REPLIT_DOMAINS=your_domain.com
   ```

   **`client/.env`:**
   ```env
   VITE_API_URL=http://localhost:3000
   ```

4. **Set up Supabase Database**

   Run this SQL in your Supabase SQL Editor:

   ```sql
   -- Create users table
   CREATE TABLE IF NOT EXISTS users (
     id TEXT PRIMARY KEY,
     email TEXT UNIQUE NOT NULL,
     name TEXT,
     is_premium BOOLEAN DEFAULT FALSE,
     stories_generated INTEGER DEFAULT 0,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create stories table
   CREATE TABLE IF NOT EXISTS stories (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
     input_text TEXT NOT NULL,
     output_story TEXT NOT NULL,
     narration_mode TEXT NOT NULL DEFAULT 'balanced',
     content_type TEXT DEFAULT 'general',
     source TEXT DEFAULT 'text',
     story_id TEXT,
     used_fallback BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create indexes
   CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
   CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
   CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

   -- Enable RLS
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

   -- RLS Policies (adjust based on your auth setup)
   CREATE POLICY "Users can view their own data" ON users
     FOR SELECT USING (true);

   CREATE POLICY "Users can update their own data" ON users
     FOR UPDATE USING (true);

   CREATE POLICY "Users can insert their own data" ON users
     FOR INSERT WITH CHECK (true);

   CREATE POLICY "Users can view their own stories" ON stories
     FOR SELECT USING (true);

   CREATE POLICY "Users can insert their own stories" ON stories
     FOR INSERT WITH CHECK (true);

   CREATE POLICY "Users can update their own stories" ON stories
     FOR UPDATE USING (true);

   CREATE POLICY "Users can delete their own stories" ON stories
     FOR DELETE USING (true);

   -- Auto-update timestamps
   CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $$
   BEGIN
       NEW.updated_at = NOW();
       RETURN NEW;
   END;
   $$ language 'plpgsql';

   CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

   CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
   ```

5. **Start the development servers**
   ```bash
   npm run dev
   ```
   
   This starts both frontend (port 5173) and backend (port 3000) simultaneously.

6. **Open your browser**
   Navigate to [http://localhost:5173](http://localhost:5173)

## 📖 Usage Guide

### Demo Login
- Click "Try Demo" for instant access
- No registration required
- Full access to all features

### Creating Stories

#### From Text
1. Enter your text in the input field
2. Choose your narration mode (Focus, Balanced, or Engaging)
3. Click "Generate Magical Story"
4. Listen with ambient audio

#### From PDF
1. Click "Upload PDF" button under the text input
2. Select a PDF file (max 5MB for free users, 20MB for premium)
3. AI automatically detects content type
4. Choose your preferred narration mode
5. Generate an immersive story

### Audio Controls
- Background music and SFX cues are mixed server-side when enabled
- Audio download as MP3
- Multiple TTS options; premium voices for pro users

## 🎯 Use Cases

### For Students
- Transform study materials into engaging stories
- Make complex topics easier to understand
- Create memorable learning experiences

### For Professionals
- Convert reports and documents into compelling narratives
- Present technical information in an accessible way
- Create engaging presentations

### For Educators
- Design interactive lessons
- Make curriculum content more engaging
- Support different learning styles

### For Writers
- Get inspiration for creative content
- Transform research into storytelling
- Develop new narrative approaches

## 🔧 Configuration

### User Limits

#### Free Users
- 2 stories per session
- 600 character input limit
- 5MB PDF upload limit
- Basic TTS (browser synthesis)

#### Premium Users
- Unlimited stories
- 20,000 character input limit
- 20MB PDF upload limit
- Premium TTS (ElevenLabs + OpenAI)

### Custom Background Audio
Add your own background music files:
1. Place MP3 files in `assets/audio/backgrounds/`
2. Name them according to mode: `focus.mp3`, `balanced.mp3`, `engaging.mp3`
3. The app will automatically use your custom audio

### AI Model Configuration
Modify story generation settings in `server/routes.ts`:
- Change AI models
- Adjust temperature and token limits
- Customize narration mode prompts

## Endpoints Overview

- `POST /api/story`
  - Generates a story from text.
  - Body: `{ text: string, narrationMode: 'focus' | 'balanced' | 'engaging' | 'doc_theatre' }`
  - Auth: optional. Demo header `x-demo-user: true` is supported. For real users, send `Authorization: Bearer <supabase_jwt>`.
  - Storage: Saves story to `stories` table for authenticated users; demo users save under their id, anonymous may be used for legacy entries.

- `POST /api/pdf-to-story`
  - Generates a story from PDF text.
  - Body: `{ pdfText: string, narrationMode: ... }`
  - Similar auth and storage behavior as `/api/story`.

- `GET /api/stories`
  - Returns latest stories for the authenticated user. Demo users merge `demo@gmail.com` and `anonymous` stories.

- `GET /api/me`
  - Returns or creates the current user using header `x-user-id` (MVP) or Supabase auth context.

- `POST /api/story/:id/audio`
  - Creates audio from a specific story. Supports optional background music and mixing.

- `POST /api/upgrade`
  - Marks the current user as premium (MVP).
  - Auth: send `Authorization` headers if logged-in, or `x-user-id` for demo (`demo@gmail.com`).

## Narration Modes In-Depth

- Focus: System prompt enforces precise, structured explanations; preserves all factual content.
- Balanced (Guide): System prompt enforces a friendly, conversational style with accuracy.
- Engaging (Storyteller): System prompt creates engaging narrative while preserving facts.
- Doc Theatre: System prompt directs multi-voice scripts, overlapping, interjections, and embeds [SFX:] and [BG:] cues.

To manually switch mode in API calls, provide `narrationMode` as one of: `focus`, `balanced`, `engaging`, `doc_theatre`.

## 📁 Project Structure

```
storymagic/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and services
├── server/                # Backend Express app
│   ├── routes.ts          # API endpoints
│   ├── supabase.ts        # Database operations
│   └── index.ts           # Server entry point
├── shared/                # Shared types and schemas
├── assets/                # Static assets
│   └── audio/             # Background audio files
└── tmp/                   # Temporary audio files
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy the dist/ folder
```

### Backend (Railway/Render)
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

### Common Issues

**Demo login fails:**
- Check if backend is running on port 3000
- Verify proxy configuration in `vite.config.ts`
- Check browser console for errors

**Audio not working:**
- Ensure FFmpeg is installed and in PATH
- Check API keys for TTS services
- Verify browser supports Web Audio API

**Database errors:**
- Confirm Supabase credentials in `.env`
- Check if tables exist in Supabase dashboard
- Verify RLS policies are configured

**Port conflicts:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill //PID <PID> //F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Development Commands
```bash
npm run dev          # Start both frontend and backend
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

## 🔮 Roadmap

- [ ] Advanced PDF processing with OCR
- [ ] More AI models and voices
- [ ] Story templates and themes
- [ ] Collaborative storytelling
- [ ] Mobile app version
- [ ] Advanced audio mixing
- [ ] Story sharing and community features
- [ ] User authentication and profiles
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

