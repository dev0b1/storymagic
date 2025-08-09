# Overview

Story Whirl is a full-stack web application that transforms plain text into whimsical, narrated children's stories using AI. Users can input any text, select from three distinct storytelling characters (Lumi the Owl, Sir Spark the Fox, or Bella the Bot), and receive a magical story adaptation with optional audio narration. The application features a fantasy-themed UI with magical animations, user authentication via Replit Auth, and AI-powered story generation through OpenRouter API.

## Recent Updates (2025-01-09)

- **Migration to Replit**: Successfully migrated from Replit Agent to standard Replit environment
- **Robust Fallback System**: Added comprehensive story generation fallbacks using template system
- **Enhanced Audio Features**: Added audio download capability and TTS provider indicators
- **Background Audio**: Implemented magical ambient background music during story reading
- **Provider Indicators**: Visual indicators showing which TTS service is being used (ElevenLabs/OpenAI/Browser)
- **Comprehensive Documentation**: Added detailed README.md with setup instructions and architecture overview
- **Improved Error Handling**: Enhanced error boundaries and graceful degradation for all services

## Previous Updates (2025-01-04)

- **App Rebranding**: Renamed from "StoryMagic AI" to "Story Whirl"
- **Authentication Migration**: Replaced Supabase Auth with Replit Auth for better reliability
- **Story Limits Implementation**: Free users limited to 2 stories, premium users unlimited
- **Audio Features**: Added text-to-speech narration with character-specific voices
- **Enhanced Story Reading**: Auto-scrolling story display with paragraph highlighting
- **Demo Account**: Added demo@gmail.com for easy testing
- **Database Migration**: Updated schema to support premium features and story limits
- **UI/UX Improvements**: Fixed image display, enhanced navigation, added progress indicators
- **Layout Improvements**: Compact header, horizontal character selection, recent stories under input
- **Enhanced TTS**: ElevenLabs premium voices with OpenAI and browser TTS fallbacks
- **Single Column Layout**: Improved mobile-friendly design with better content flow

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built with React and TypeScript using Vite as the build tool. The UI follows a component-based architecture with:

- **Routing**: Wouter for client-side routing with pages for landing, authentication, and dashboard
- **Styling**: Tailwind CSS with custom magical theme colors and animations, plus shadcn/ui component library
- **State Management**: React Query for server state and React hooks for local state
- **UI Components**: Comprehensive component library using Radix UI primitives with custom theming

The application uses a fantasy aesthetic with magical sparkle animations, gradient backgrounds, and whimsical typography (Macondo font for magical elements).

## Backend Architecture
The backend is built with Express.js and TypeScript:

- **API Structure**: RESTful endpoints with centralized route registration
- **Story Generation**: Integration with OpenRouter API using Claude-3-Haiku model for AI story generation
- **Character System**: Three predefined character personas with distinct storytelling styles
- **Development Setup**: Vite integration for hot module replacement in development

## Data Storage
The application uses a hybrid storage approach:

- **Database**: PostgreSQL with Drizzle ORM for schema management and migrations
- **Connection**: Neon Database for PostgreSQL hosting
- **Schema**: Users and stories tables with proper relationships
- **Development Storage**: In-memory storage implementation for development/testing

## Authentication and Authorization
Authentication is handled through Replit Auth and simple session management:

- **Magic Link Authentication**: Email-based passwordless login (simulated for development)
- **Demo Account**: demo@gmail.com available for instant testing
- **Session Management**: LocalStorage-based session handling
- **Route Protection**: Client-side route guards redirect unauthenticated users
- **User State**: Simple auth service manages authentication state

# External Dependencies

## AI Services
- **OpenRouter API**: Primary AI service for story generation using Anthropic's Claude-3-Haiku model
- **Model Configuration**: Configured for creative writing with temperature 0.8 and character persona system prompts
- **Text-to-Speech**: OpenAI TTS integration for audio narration with character-specific voices
- **Story Features**: Auto-scrolling text display, audio generation, MP3 downloads

## Authentication Services
- **Replit Auth**: Integrated authentication solution with simplified user management
- **Demo Authentication**: Instant demo account access for testing

## Database Services
- **Neon Database**: PostgreSQL-compatible serverless database for production
- **Drizzle ORM**: Type-safe database toolkit for schema management and queries

## UI and Styling
- **Tailwind CSS**: Utility-first CSS framework with custom magical color scheme
- **Radix UI**: Unstyled accessible component primitives
- **shadcn/ui**: Pre-built component library built on Radix UI
- **Google Fonts**: Macondo font for magical typography elements

## Development Tools
- **Vite**: Build tool and development server with React plugin
- **TypeScript**: Type safety across frontend and backend
- **React Query**: Server state management and caching
- **Wouter**: Lightweight client-side routing

## Hosting and Deployment
- **Replit**: Development and potentially production hosting environment
- **Environment Variables**: Configuration for database connections and API keys