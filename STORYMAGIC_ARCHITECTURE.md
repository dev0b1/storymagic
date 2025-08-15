# StoryMagic AI - Complete Architecture & Data Flow Documentation

## 🏗️ **System Overview**

StoryMagic AI is a full-stack web application that converts PDFs and text into narrated stories with background music. The system uses AI-powered story generation (OpenRouter) and professional TTS services (ElevenLabs/OpenAI) to create engaging audio experiences.

## 🔄 **Complete Data Flow**

### **1. Text/PDF Input → Story Generation**
```
User Input (Text/PDF) → OpenRouter API → AI-Generated Story → Database Storage
```

**Process:**
1. **Input Reception**: User provides text or uploads PDF
2. **Content Analysis**: System detects content type (academic, business, technical, etc.)
3. **Prompt Generation**: Adaptive prompts created based on content type and narration mode
4. **AI Processing**: OpenRouter API generates story using Mistral AI model
5. **Story Storage**: Generated story saved to Supabase database with metadata

**Key Components:**
- **Content Type Detection**: Automatically identifies document type for optimal prompt generation
- **Narration Modes**: 
  - `focus`: Facts-only, professional delivery
  - `balanced`: Natural + informative (default)
  - `engaging`: Storytelling when appropriate
- **Adaptive Prompts**: Dynamic prompt generation based on content type and mode

### **2. Story → Audio Generation**
```
Generated Story → TTS Service (ElevenLabs/OpenAI) → Audio File → Storage
```

**Process:**
1. **Story Selection**: User chooses story to convert to audio
2. **TTS Request**: Server sends story to TTS service
3. **Audio Generation**: Service creates MP3 audio file
4. **File Storage**: Audio stored on server with URL reference
5. **Response**: Audio URL returned to client

**TTS Priority:**
1. **ElevenLabs** (Premium quality, natural voices)
2. **OpenAI** (High quality, reliable)
3. **No Fallback** - System requires valid API keys

### **3. Audio → Background Music Integration**
```
Audio File + Background Music → FFmpeg Processing → Mixed Audio → Final Output
```

**Process:**
1. **Audio Retrieval**: Server fetches generated TTS audio
2. **Background Generation**: Web Audio API creates ambient music
3. **Audio Mixing**: FFmpeg combines TTS with background music
4. **Final Output**: Mixed audio file with synchronized playback

**Background Music Profiles:**
- **Calm Professional**: Subtle, non-distracting ambient sounds
- **Natural Educational**: Gentle, engaging background music
- **Dramatic Narrative**: Dynamic, story-enhancing soundscapes

## 🏛️ **Architecture Components**

### **Frontend (React + TypeScript)**
```
client/src/
├── components/          # UI Components
│   ├── story-reader.tsx    # Main story display & audio controls
│   ├── magical-audio.tsx   # Background music generation
│   └── pro-features.tsx    # Premium features display
├── pages/              # Application pages
│   ├── dashboard.tsx       # Main user interface
│   ├── landing.tsx         # Homepage & onboarding
│   └── auth.tsx            # Authentication
├── lib/                # Client-side services
│   ├── auth.ts            # Authentication service
│   ├── openrouter.ts      # API client for story generation
│   └── supabase.ts        # Supabase client
└── hooks/              # Custom React hooks
    └── use-mobile.tsx     # Mobile detection
```

### **Backend (Express + TypeScript)**
```
server/
├── index.ts           # Server entry point & configuration
├── routes.ts          # API endpoints & business logic
├── config.ts          # Configuration management
├── supabase.ts        # Database operations
├── db.ts             # Database connection
└── vite.ts           # Development server setup
```

### **Database (Supabase/PostgreSQL)**
```
Tables:
├── users              # User accounts & premium status
│   ├── id (primary key)
│   ├── email
│   ├── is_premium
│   └── stories_generated
└── stories            # Generated stories & metadata
    ├── id (primary key)
    ├── user_id (foreign key)
    ├── input_text
    ├── output_story
    ├── narration_mode
    ├── content_type
    └── source
```

## 🔌 **API Endpoints**

### **Story Generation**
```
POST /api/story
- Generates story from text input
- Uses OpenRouter API with Mistral AI
- Returns: { story, narrationMode, storyId, savedStory }

POST /api/pdf-to-story
- Converts PDF content to story
- Extracts text using pdf-parse
- Returns: { story, narrationMode, contentType, storyId, source }

POST /api/upload-pdf
- Handles PDF file uploads
- Combines PDF processing + story generation
- Returns: { story, narrationMode, contentType, storyId, source }
```

### **Audio Generation**
```
POST /api/story/:id/audio
- Generates audio from story
- Uses ElevenLabs/OpenAI TTS
- Returns: { audioUrl, provider, message }

GET /api/story/:id/audio
- Retrieves existing audio for story
- Returns: { audioUrl, provider }
```

### **User Management**
```
GET /api/me
- Returns current user information
- Creates user if doesn't exist

GET /api/stories
- Returns user's story history
- Includes metadata and audio status

POST /api/demo-login
- Creates demo user session
- For testing without authentication
```

## 🔑 **Configuration & Environment Variables**

### **Required API Keys**
```bash
# Story Generation
OPENROUTER_API_KEY=sk-or-v1-your_key_here

# Text-to-Speech
ELEVENLABS_API_KEY=your_elevenlabs_key_here
OPENAI_API_KEY=sk-your_openai_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

### **Configuration Management**
```typescript
// server/config.ts
export const config = {
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  port: process.env.PORT || 3000,
  // ... other config
};

export const hasValidApiKeys = () => {
  return {
    openRouter: config.openRouterApiKey && config.openRouterApiKey !== 'your_openrouter_api_key_here',
    elevenLabs: config.elevenLabsApiKey && config.elevenLabsApiKey !== 'your_elevenlabs_api_key_here',
    openAI: config.openaiApiKey && config.openaiApiKey !== 'your_openai_api_key_here',
  };
};
```

## 🎵 **Audio System Architecture**

### **TTS Service Integration**
```typescript
// Priority-based TTS selection
async function generateTTS(text: string, userId: string) {
  try {
    // Try ElevenLabs first (premium quality)
    if (config.elevenLabsApiKey) {
      return await generateElevenLabsAudio(text);
    }
    
    // Fallback to OpenAI
    if (config.openaiApiKey) {
      return await generateOpenAIAudio(text);
    }
    
    throw new Error('No TTS service configured');
  } catch (error) {
    console.error('TTS generation failed:', error);
    throw error;
  }
}
```

### **Background Music System**
```typescript
// Web Audio API for dynamic background music
class MagicalAudio {
  private audioContext: AudioContext;
  private oscillator: OscillatorNode;
  private gainNode: GainNode;
  
  generateAmbientMusic(profile: string) {
    // Generate different sound profiles based on narration mode
    switch (profile) {
      case 'calm-professional':
        return this.generateCalmSounds();
      case 'natural-educational':
        return this.generateEducationalSounds();
      case 'dramatic-narrative':
        return this.generateDramaticSounds();
    }
  }
}
```

## 🚀 **Deployment & Production**

### **Development Setup**
```bash
# Install dependencies
npm install

# Set environment variables
# Create .env file with your API keys

# Start development server
npm run dev
```

### **Production Considerations**
- **Environment Variables**: Ensure all API keys are properly configured
- **Database**: Supabase production instance with proper RLS policies
- **File Storage**: Audio files stored securely with access controls
- **Error Handling**: Comprehensive error logging and user feedback
- **Rate Limiting**: Implement API rate limiting for production use

## 🔧 **Customization Guide**

### **Adding New TTS Services**
```typescript
// Add new TTS provider
async function generateCustomTTS(text: string): Promise<AudioResult> {
  const response = await fetch('https://your-tts-service.com/api', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${config.customTTSKey}` },
    body: JSON.stringify({ text, voice: 'default' })
  });
  
  const result = await response.json();
  return {
    audioUrl: result.audio_url,
    provider: 'custom-tts',
    duration: result.duration
  };
}
```

### **Modifying Story Generation Prompts**
```typescript
// Customize prompts in routes.ts
function generateAdaptivePrompt(contentType: string, narrationMode: string): string {
  const basePrompt = `You are a professional storyteller. Convert the following content into an engaging story...`;
  
  // Add custom logic for different content types
  if (contentType === 'academic') {
    return `${basePrompt} Focus on making complex concepts accessible while maintaining accuracy.`;
  }
  
  return basePrompt;
}
```

### **Custom Background Music Profiles**
```typescript
// Add new audio profiles in magical-audio.tsx
const audioProfiles = {
  'custom-profile': {
    frequency: 440,
    waveform: 'sine',
    envelope: { attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.3 }
  }
};
```

## 📊 **Error Handling & Logging**

### **API Error Handling**
```typescript
// Comprehensive error handling for all endpoints
try {
  const result = await externalAPI();
  if (!result.success) {
    console.error('❌ API Error:', result.error);
    return res.status(500).json({ 
      message: 'Service temporarily unavailable',
      error: result.error 
    });
  }
} catch (error) {
  console.error('❌ Unexpected Error:', error);
  return res.status(500).json({ 
    message: 'Internal server error',
    error: error instanceof Error ? error.message : 'Unknown error'
  });
}
```

### **User Feedback System**
```typescript
// Toast notifications for user feedback
const { toast } = useToast();

// Success feedback
toast({
  title: "Audio Generated!",
  description: "Your story is ready to listen 🎵"
});

// Error feedback
toast({
  title: "Generation Failed",
  description: "Please check your API keys and try again",
  variant: "destructive"
});
```

## 🔍 **Troubleshooting**

### **Common Issues**
1. **OpenRouter API Errors**: Check API key configuration and rate limits
2. **TTS Failures**: Verify ElevenLabs/OpenAI API keys and quotas
3. **PDF Processing**: Ensure pdf-parse is properly installed
4. **Audio Playback**: Check browser audio permissions and file access

### **Debug Steps**
1. **Check Server Logs**: Look for configuration status and API errors
2. **Verify Environment**: Ensure .env file contains valid API keys
3. **Test API Endpoints**: Use tools like Postman to test individual endpoints
4. **Check Database**: Verify Supabase connection and table structure

## 📚 **Additional Resources**

- **OpenRouter API**: https://openrouter.ai/docs
- **ElevenLabs API**: https://elevenlabs.io/docs
- **OpenAI API**: https://platform.openai.com/docs
- **Supabase**: https://supabase.com/docs
- **FFmpeg**: https://ffmpeg.org/documentation.html

---

**This documentation provides a complete understanding of StoryMagic AI's architecture and data flow. Use it as a reference for customizations, debugging, and system maintenance.**
