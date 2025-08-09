# Story Whirl 🌟

A magical full-stack web application that transforms plain text into whimsical, narrated children's stories using AI. Built with React, TypeScript, Express, and integrated with OpenRouter API for story generation.

## ✨ Features

- **AI Story Generation**: Transform any text into magical stories using OpenRouter API with fallback templates
- **Character Personalities**: Choose from 3 unique storytellers:
  - **Lumi the Owl**: Wise, calm, and educational storyteller
  - **Sir Spark the Fox**: Bold, poetic storyteller who speaks in rhyme
  - **Bella the Bot**: Fast, funny, cheeky storyteller with wild imagination
- **Text-to-Speech**: Multi-provider audio narration with character-specific voices
  - Premium: ElevenLabs voices (if API key provided)
  - Standard: OpenAI TTS (if API key provided)
  - Fallback: Browser speech synthesis
- **Audio Downloads**: Save generated audio as MP3 files
- **User Authentication**: Replit Auth integration with demo account
- **Story Limits**: Free users (2 stories), Premium users (unlimited)
- **Real-time Features**: Auto-scrolling story display with paragraph highlighting
- **Responsive Design**: Mobile-friendly UI with magical animations

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ installed
- OpenRouter API key (required for AI story generation)
- Optional: OpenAI API key (for enhanced TTS)
- Optional: ElevenLabs API key (for premium voices)

### Installation from GitHub

```bash
# Clone the repository
git clone <your-github-repo-url>
cd story-whirl

# Install dependencies
npm install

# Set up environment variables
# Create a .env file in the root directory with:
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENAI_API_KEY=your_openai_api_key_here  # Optional
ELEVENLABS_API_KEY=your_elevenlabs_key_here  # Optional

# Start the development server
npm run dev
```

### Get API Keys

1. **OpenRouter API Key** (Required):
   - Visit [openrouter.ai](https://openrouter.ai)
   - Create an account
   - Get your API key from the dashboard
   - Add it to your environment variables

2. **OpenAI API Key** (Optional for enhanced TTS):
   - Visit [platform.openai.com](https://platform.openai.com)
   - Create an account and get API key
   - Add it to your environment variables

3. **ElevenLabs API Key** (Optional for premium voices):
   - Visit [elevenlabs.io](https://elevenlabs.io)
   - Create an account and get API key
   - Add it to your environment variables

## 🏗️ Architecture

### Frontend (React + TypeScript)
```
client/src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui component library
│   ├── character-card.tsx
│   ├── story-reader.tsx # Audio playback and story display
│   └── ...
├── pages/              # Route components
│   ├── dashboard.tsx   # Main story generation interface
│   ├── auth.tsx        # Authentication page
│   └── landing.tsx     # Landing page
├── lib/                # Utility libraries
│   ├── auth.ts         # Authentication service
│   ├── queryClient.ts  # React Query configuration
│   └── utils.ts        # General utilities
└── hooks/              # Custom React hooks
```

### Backend (Express + TypeScript)
```
server/
├── index.ts            # Application entry point
├── routes.ts           # API route definitions
├── storage.ts          # Data storage interface
├── db.ts              # Database configuration
└── vite.ts            # Vite integration for development
```

### Database Schema
```
shared/schema.ts        # Shared type definitions and Drizzle schema

Tables:
- users: User profiles with premium status and story counts
- stories: Generated stories with user associations
```

## 📡 API Endpoints

### Authentication
- `POST /api/demo-login` - Demo account login
- `POST /api/user` - Create/get user account
- `GET /api/me` - Get current user info

### Story Generation
- `POST /api/story` - Generate new story
  - Body: `{ text: string, character: string, userId?: string }`
  - Response: `{ story: string, character: string, storyId?: string, usedFallback: boolean }`

### Story Management
- `GET /api/stories` - Get user's stories (latest 3)
- `POST /api/story/:id/audio` - Generate audio for story

## 🎯 Development Workflow

### Available Scripts

```bash
# Development
npm run dev          # Start development server (frontend + backend)

# Production
npm run build        # Build for production
npm start           # Start production server

# Database
npm run db:push     # Push database schema changes

# Type checking
npm run check       # TypeScript type checking
```

### Development Features

- **Hot Module Replacement**: Instant updates during development
- **Concurrent Servers**: Frontend (Vite) and backend (Express) run together
- **Type Safety**: Full TypeScript coverage across frontend and backend
- **Error Handling**: Comprehensive error boundaries and fallback systems

## 🛠️ Technology Stack

### Core Technologies
- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: PostgreSQL with Neon Database hosting
- **ORM**: Drizzle ORM with Zod validation

### UI & Styling
- **Design System**: shadcn/ui components built on Radix UI
- **Styling**: Tailwind CSS with custom magical theme
- **Icons**: Lucide React icons
- **Animations**: Framer Motion, custom CSS animations
- **Typography**: Macondo font for magical elements

### External Services
- **AI Generation**: OpenRouter API (Claude/Mistral models)
- **Text-to-Speech**: ElevenLabs (premium), OpenAI TTS, Browser Speech API
- **Authentication**: Replit Auth
- **Database Hosting**: Neon Database

### Development Tools
- **Build Tool**: Vite with React plugin
- **Package Manager**: npm
- **Code Quality**: TypeScript strict mode
- **State Management**: React Query for server state, React hooks for local state

## 🔧 Configuration

### Environment Variables

```bash
# Required
OPENROUTER_API_KEY=your_key_here

# Optional (for enhanced features)
OPENAI_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here

# Database (auto-configured on Replit)
DATABASE_URL=your_postgres_url
```

### Database Setup

The application automatically handles database schema with Drizzle ORM:

```bash
# Push schema changes to database
npm run db:push
```

### Custom Configuration

1. **Story Characters**: Modify character personalities in `server/routes.ts`
2. **UI Theme**: Update Tailwind configuration in `tailwind.config.ts`
3. **Audio Settings**: Adjust TTS voice mappings in `components/story-reader.tsx`

## 🚀 Deployment

### Replit Deployment

1. Push your code to the Replit environment
2. Ensure environment variables are set
3. The application will automatically deploy

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🎨 Customization

### Adding New Characters

1. Update character definitions in `components/character-card.tsx`
2. Add character personas in `server/routes.ts`
3. Configure TTS voice settings in `components/story-reader.tsx`
4. Add fallback story templates in `server/routes.ts`

### Modifying UI Theme

1. Update color scheme in `index.css`
2. Modify Tailwind configuration in `tailwind.config.ts`
3. Customize component styles in respective component files

### Extending Audio Features

1. Add new TTS providers in `server/routes.ts`
2. Configure voice mappings in `components/story-reader.tsx`
3. Update provider indicators in the UI

## 🐛 Troubleshooting

### Common Issues

1. **Story Generation Fails**
   - Check OpenRouter API key is set correctly
   - Verify API credits/quota
   - Fallback templates will be used automatically

2. **Audio Not Working**
   - Check TTS provider API keys
   - Browser TTS always available as fallback
   - Verify browser permissions for audio

3. **Database Errors**
   - Run `npm run db:push` to sync schema
   - Check database connection URL

### Debugging

- Check browser console for frontend errors
- Check server logs for backend issues
- Use React Query DevTools for API debugging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [Replit Documentation](https://docs.replit.com)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Drizzle ORM Documentation](https://orm.drizzle.team)