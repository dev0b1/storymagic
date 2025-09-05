# StoryMagic AI ✨

Transform your ideas into captivating stories with AI-powered narration and multi-voice podcasts.

## 🚀 Features

- **AI Story Generation**: Transform any text into engaging stories
- **Professional Narration**: High-quality voice synthesis with multiple styles
- **Multi-Voice Podcasts**: Create dynamic audio content with different character voices
- **Supabase Authentication**: Secure Google OAuth integration
- **Modern Tech Stack**: Next.js 15, TypeScript, Tailwind CSS

## 📋 What's Included

- ✅ **Next.js 15** with App Router
- ✅ **Supabase Authentication** (Google OAuth)
- ✅ **Drizzle ORM** with Neon Database
- ✅ **Tailwind CSS** for styling
- ✅ **Radix UI** components
- ✅ **React Query** for data fetching
- ✅ **TypeScript** throughout

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# Supabase (for authentication)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# API Keys
OPENROUTER_API_KEY="your-openrouter-api-key"
ELEVENLABS_API_KEY="your-elevenlabs-api-key"
OPENAI_API_KEY="your-openai-api-key"

# Lemon Squeezy
LEMONSQUEEZY_API_KEY="your-lemonsqueezy-api-key"
LEMONSQUEEZY_STORE_ID="your-store-id"
LEMONSQUEEZY_VARIANT_ID="your-variant-id"
LEMONSQUEEZY_WEBHOOK_SECRET="your-webhook-secret"
```

### 3. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Enable Google OAuth in Authentication > Providers
3. Add your redirect URL: `https://your-domain.com/auth/callback`
4. Copy your project URL and anon key to `.env.local`

### 4. Database Setup

```bash
# Push your schema to the database
npm run db:push

# Generate new migrations (if needed)
npm run db:generate

# Open Drizzle Studio (optional)
npm run db:studio
```

### 5. Run Development Server

```bash
npm run dev
```

Your app will be available at `http://localhost:3000`

## 📁 Project Structure

```
storymagic/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard page
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── ui/               # UI components (Button, etc.)
│   │   ├── chat/             # Chat interface components
│   │   └── providers.tsx     # Context providers
│   ├── context/              # React contexts
│   ├── hooks/                # Custom React hooks
│   └── lib/                  # Utility functions
│       ├── db.ts             # Database configuration
│       ├── supabase.ts       # Supabase client
│       └── utils.ts          # Utility functions
├── shared/                   # Shared code
│   └── schema.ts            # Database schema
├── drizzle.config.ts         # Drizzle configuration
└── package.json             # Dependencies
```

## 🔐 Authentication Flow

1. **Sign In**: User clicks "Continue with Google" on `/auth`
2. **OAuth Redirect**: Google redirects to Supabase
3. **Callback**: Supabase redirects to `/auth/callback`
4. **Session**: User is authenticated and redirected to `/dashboard`
5. **Protected Routes**: Dashboard checks for valid session

## 🎯 Current Status

✅ **Fully Functional Features:**
- Authentication system (Google OAuth + demo mode)
- Dashboard with chat interface
- Story generation API endpoints
- Database operations with fallback
- All UI components and modals

⚠️ **Needs Configuration:**
- Database connection (currently using demo mode)
- OpenRouter API key for story generation
- ElevenLabs API key for audio features

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect your repository to Vercel
3. Add environment variables
4. Deploy!

### Other Platforms

- **Netlify**: Supports Next.js
- **Railway**: Good for full-stack apps
- **Render**: Supports Next.js applications

## 🔧 Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push database schema
npm run db:generate  # Generate migrations
npm run db:studio    # Open Drizzle Studio
```

## 💡 Tips

- **Hot Reload**: Next.js has excellent hot reload support
- **Type Safety**: Use TypeScript for better development experience
- **API Routes**: Create API endpoints in `src/app/api/`
- **Middleware**: Use Next.js middleware for authentication
- **Environment**: Use `.env.local` for local development

## 🆘 Need Help?

If you encounter any issues:

1. Check the console for error messages
2. Verify your environment variables
3. Ensure Supabase is properly configured
4. Check that your database is accessible

## 🎉 Ready to Use!

Your StoryMagic application is ready to go! The migration from Express + Vite to Next.js is complete, providing a much cleaner and more maintainable codebase.

**Happy storytelling! 🚀**
