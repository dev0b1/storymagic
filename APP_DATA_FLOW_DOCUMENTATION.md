# StoryMagic App - Complete Data Flow Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Authentication Flow](#authentication-flow)
3. [Database Management](#database-management)
4. [Story Generation Process](#story-generation-process)
5. [Audio Generation](#audio-generation)
6. [Data Storage & Retrieval](#data-storage--retrieval)
7. [Code Comments for Non-Technical Users](#code-comments-for-non-technical-users)
8. [Complete User Journey](#complete-user-journey)

---

## 🎯 Overview

StoryMagic is a Next.js application that allows users to:
1. **Sign in** with Google via Supabase authentication
2. **Generate stories** from text input using AI (OpenRouter API)
3. **Create audio narrations** of stories using ElevenLabs
4. **Save and retrieve** stories in a PostgreSQL database
5. **Manage user data** including story counts and premium status

---

## 🔐 Authentication Flow

### Step 1: User Visits the App
```
User opens browser → Goes to localhost:3000 → Sees landing page
📁 Files involved: src/app/page.tsx (landing page)
```

### Step 2: User Clicks "Sign In"
```
User clicks "Sign In" → Redirected to /auth page → Sees Google sign-in button
📁 Files involved: src/app/auth/page.tsx (auth page)
```

### Step 3: Google Authentication
```
User clicks "Continue with Google" → Google OAuth popup → User grants permission
📁 Files involved: 
- src/app/auth/page.tsx (handles Google sign-in button)
- src/lib/supabase.ts (Supabase client configuration)
```

### Step 4: Supabase Handles Authentication
```
Google returns user data → Supabase creates/updates user → Returns JWT token
📁 Files involved:
- src/lib/supabase.ts (Supabase client)
- src/context/AuthContext.tsx (manages auth state)
```

### Step 5: User Redirected to Dashboard
```
Authentication successful → User redirected to /dashboard → App loads user data
📁 Files involved:
- src/app/dashboard/page.tsx (dashboard page)
- src/components/auth-guard.tsx (protects dashboard)
- src/app/api/me/route.ts (loads user data)
```

### Code Flow for Authentication:

**File: `src/app/auth/page.tsx`**
```typescript
// This is the sign-in page where users authenticate
export default function AuthPage() {
  // These are like variables that store information about the user
  const { user, loading } = useAuth() // Gets current user status from our app's memory
  
  // This function runs when user clicks "Continue with Google"
  const handleGoogleSignIn = async () => {
    // Tell Supabase to start Google sign-in process
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google', // Use Google as the sign-in provider
      options: {
        redirectTo: `${window.location.origin}/auth/callback` // Where to go after sign-in
      }
    });
  };
}
```

**File: `src/context/AuthContext.tsx`**
```typescript
// This file manages user authentication state across the entire app
export function AuthProvider({ children }) {
  // These are like memory slots that remember user information
  const [user, setUser] = useState(null); // Stores the current user
  const [loading, setLoading] = useState(true); // Tracks if we're still checking who the user is
  
  // This runs when the app starts to check if user is already signed in
  useEffect(() => {
    const getSession = async () => {
      // Ask Supabase: "Is there a user already signed in?"
      const { data: { session }, error } = await supabase.auth.getSession();
      setUser(session?.user ?? null); // Save user info to memory
    };
    getSession();
  }, []);
}
```

---

## 🗄️ Database Management

### Database Structure
The app uses a PostgreSQL database with two main tables:

#### 1. **Users Table** - Stores user information
```sql
-- This is what the users table looks like in the database
CREATE TABLE users (
  id TEXT PRIMARY KEY,           -- Unique identifier (from Supabase)
  email TEXT NOT NULL,           -- User's email address
  name TEXT,                     -- User's display name
  is_premium BOOLEAN DEFAULT false, -- Whether user has paid subscription
  stories_generated INTEGER DEFAULT 0, -- How many stories user has created
  created_at TIMESTAMP,          -- When account was created
  updated_at TIMESTAMP           -- When account was last updated
);
```

#### 2. **Stories Table** - Stores generated stories
```sql
-- This is what the stories table looks like in the database
CREATE TABLE stories (
  id TEXT PRIMARY KEY,           -- Unique story identifier
  user_id TEXT NOT NULL,         -- Which user owns this story
  input_text TEXT NOT NULL,      -- Original text user entered
  output_story TEXT NOT NULL,    -- AI-generated story
  narration_mode TEXT NOT NULL,  -- Style of narration (focus, engaging, etc.)
  source TEXT NOT NULL,          -- How story was created (api, pdf)
  created_at TIMESTAMP,          -- When story was created
  audio_url TEXT,                -- URL to audio file (if generated)
  audio_provider TEXT            -- Which service created the audio
);
```

### Database Service Code

**File: `src/lib/database-service.ts`**
```typescript
// This class handles all database operations
export class DatabaseService {
  
  // Check if database connection is working
  static async validateDatabase(): Promise<boolean> {
    try {
      // Try to read from both tables to make sure they exist
      await db.select().from(users).limit(1); // "Get 1 user from users table"
      await db.select().from(stories).limit(1); // "Get 1 story from stories table"
      return true; // If no errors, database is working
    } catch (error) {
      // If there's an error, throw it with a helpful message
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  // Get user information from database
  static async getUser(userId: string) {
    try {
      // SQL equivalent: "SELECT * FROM users WHERE id = userId LIMIT 1"
      const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      return rows[0] || null; // Return first result or null if no user found
    } catch (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
  }

  // Get all stories for a specific user
  static async getUserStories(userId: string, limit: number = 50) {
    try {
      // SQL equivalent: "SELECT * FROM stories WHERE user_id = userId ORDER BY created_at DESC LIMIT 50"
      const rows = await db
        .select()
        .from(stories)
        .where(eq(stories.user_id, userId)) // Only get stories for this user
        .orderBy(desc(stories.created_at)) // Sort by newest first
        .limit(limit); // Only get 50 most recent stories
      return rows;
    } catch (error) {
      throw new Error(`Failed to fetch user stories: ${error.message}`);
    }
  }

  // Save a new story to the database
  static async createStory(input: {
    user_id: string;        // Who owns this story
    input_text: string;     // What the user typed
    output_story: string;   // What the AI generated
    narration_mode: string; // How the story should be told
    source: 'api' | 'pdf';  // How it was created
  }) {
    try {
      // Make sure we have a story to save (not empty)
      const storyData = {
        ...input,
        output_story: input.output_story || 'Story generation failed'
      };
      
      // SQL equivalent: "INSERT INTO stories (...) VALUES (...)"
      const [row] = await db.insert(stories).values(storyData).returning();
      return row || null; // Return the saved story
    } catch (error) {
      throw new Error(`Failed to create story: ${error.message}`);
    }
  }

  // Create a new user account
  static async createUser(input: {
    id: string;           // User ID from Supabase
    email: string;        // User's email
    name: string;         // User's name
    is_premium: boolean;  // Whether they paid for premium
    stories_generated: number; // How many stories they've made
  }) {
    try {
      // SQL equivalent: "INSERT INTO users (...) VALUES (...)"
      const [row] = await db.insert(users).values(input).returning();
      return row || null; // Return the created user
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  // Update user information (like story count)
  static async updateUser(userId: string, updates: any) {
    try {
      // SQL equivalent: "UPDATE users SET ... WHERE id = userId"
      const [row] = await db.update(users).set(updates).where(eq(users.id, userId)).returning();
      return row || null; // Return updated user
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }
}
```

---

## 📝 Story Generation Process

### Step 1: User Enters Text
```
User types in chat input → Text is stored in component state
📁 Files involved: src/app/dashboard/page.tsx (dashboard state management)
```

### Step 2: User Selects Narration Mode
```
User clicks narration mode button → Mode is stored (focus, engaging, doc_theatre)
📁 Files involved: 
- src/app/dashboard/page.tsx (narration mode state)
- src/components/narration-mode-card.tsx (narration mode options)
```

### Step 3: User Clicks Send
```
Send button clicked → App calls /api/story endpoint
📁 Files involved:
- src/app/dashboard/page.tsx (handleSendMessage function)
- src/lib/api-client.ts (API client for making requests)
```

### Step 4: API Validates Request
```
API checks: Is user authenticated? Is text not empty? Is user under story limit?
📁 Files involved:
- src/app/api/story/route.ts (main story generation API)
- src/lib/server-auth.ts (authentication validation)
- src/lib/database-service.ts (user data retrieval)
```

### Step 5: AI Generates Story
```
API calls OpenRouter → AI processes text → Returns generated story
📁 Files involved:
- src/app/api/story/route.ts (OpenRouter API call)
- src/lib/config.ts (API key configuration and prompt generation)
```

### Step 6: Story Saved to Database
```
Generated story saved to stories table → User's story count incremented
📁 Files involved:
- src/app/api/story/route.ts (story saving logic)
- src/lib/database-service.ts (createStory and updateUser functions)
- shared/schema.ts (database table definitions)
```

### Code Flow for Story Generation:

**File: `src/app/dashboard/page.tsx`**
```typescript
// This is the main dashboard where users create stories
export default function DashboardPage() {
  // These store what the user is typing and which style they want
  const [inputText, setInputText] = useState(''); // What user typed
  const [selectedNarrationMode, setSelectedNarrationMode] = useState('engaging'); // How to tell the story
  
  // This function runs when user clicks "Send"
  const handleSendMessage = () => {
    if (!inputText.trim()) return; // Don't send empty messages
    
    // Tell the app to generate a story
    storyMutation.mutate({
      inputText: inputText.trim(), // The text user entered
      narrationMode: selectedNarrationMode // The style they chose
    });
  };

  // This handles the story generation process
  const storyMutation = useMutation({
    // This function actually calls the API to generate the story
    mutationFn: async ({ inputText, narrationMode }) => {
      return apiClient.post('/api/story', { inputText, narrationMode });
    },
    
    // This runs BEFORE the API call - shows "Generating..." message
    onMutate: ({ inputText }) => {
      // Add user's message to chat
      const userMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: inputText,
        timestamp: new Date()
      };
      
      // Add "Generating..." message
      const systemMessage = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Generating your story...',
        isGenerating: true
      };
      
      setChatMessages(prev => [...prev, userMessage, systemMessage]);
    },
    
    // This runs AFTER successful story generation
    onSuccess: (data) => {
      // Replace "Generating..." with actual story
      setChatMessages(prev => 
        prev.map(msg => 
          msg.isGenerating ? {
            ...msg,
            content: data.story, // The AI-generated story
            storyId: data.storyId, // ID to save in database
            isGenerating: false
          } : msg
        )
      );
    },
    
    // This runs if something goes wrong
    onError: (error) => {
      // Show error message to user
      toast({
        title: 'Story generation failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}
```

**File: `src/app/api/story/route.ts`**
```typescript
// This is the API endpoint that actually generates stories
export async function POST(req: Request) {
  try {
    // Step 1: Check if user is signed in
    const user = await requireSupabaseUser(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Step 2: Get the text and style from the request
    const body = await req.json();
    const inputText = body?.inputText?.trim();
    const narrationMode = body?.narrationMode || 'balanced';

    // Step 3: Check if user has permission to create stories
    const dbUser = await DatabaseService.getUser(user.id);
    const isPremium = dbUser?.is_premium || false;
    
    // Free users can only create 10 stories
    if (!isPremium && (dbUser?.stories_generated || 0) >= 10) {
      return NextResponse.json({ 
        message: 'Free users are limited to 10 stories. Upgrade to premium!',
        code: 'LIMIT_REACHED'
      }, { status: 403 });
    }

    // Step 4: Create the AI prompt based on narration mode
    const systemPrompt = generateAdaptivePrompt(narrationMode);

    // Step 5: Call OpenRouter AI to generate the story
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openRouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-small-3.2-24b-instruct:free',
        messages: [
          { role: 'system', content: systemPrompt }, // Instructions for AI
          { role: 'user', content: `User input: "${inputText}"` } // User's text
        ],
        max_tokens: 800,
        temperature: 0.7
      })
    });

    // Step 6: Get the generated story from AI
    const openRouterData = await openRouterResponse.json();
    const generatedStory = openRouterData.choices?.[0]?.message?.content;

    // Step 7: Save the story to database
    const savedStory = await DatabaseService.createStory({
      user_id: user.id,
      input_text: inputText,
      output_story: generatedStory,
      narration_mode: narrationMode,
      source: 'api'
    });

    // Step 8: Update user's story count
    await DatabaseService.updateUser(user.id, {
      stories_generated: (dbUser?.stories_generated || 0) + 1
    });

    // Step 9: Return the story to the user
    return NextResponse.json({
      story: generatedStory,
      storyId: savedStory?.id
    });

  } catch (error) {
    console.error('Story generation error:', error);
    return NextResponse.json({ 
      message: error instanceof Error ? error.message : 'Failed to generate story'
    }, { status: 500 });
  }
}
```

---

## 🎵 Audio Generation

### Step 1: Story Generated Successfully
```
Story appears in chat → User sees "Generate Audio" button
📁 Files involved: 
- src/components/chat/SystemMessage.tsx (displays story and audio button)
- src/app/dashboard/page.tsx (manages chat messages state)
```

### Step 2: User Clicks Audio Button
```
Button clicked → App calls /api/story/[storyId]/audio endpoint
📁 Files involved:
- src/components/chat/SystemMessage.tsx (generateAudio function)
- src/lib/request-headers.ts (builds authentication headers)
```

### Step 3: API Validates Story Access
```
API checks: Does user own this story? Is story valid?
📁 Files involved:
- src/app/api/story/[storyId]/audio/route.ts (audio generation API)
- src/lib/server-auth.ts (user authentication)
- src/lib/database-service.ts (story retrieval and validation)
```

### Step 4: ElevenLabs Generates Audio
```
API calls ElevenLabs → Converts story text to speech → Returns audio file
📁 Files involved:
- src/app/api/story/[storyId]/audio/route.ts (ElevenLabs API call)
- src/lib/config.ts (API key validation)
```

### Step 5: Audio URL Returned
```
Audio file converted to base64 → URL returned to frontend → User can play audio
📁 Files involved:
- src/app/api/story/[storyId]/audio/route.ts (audio processing)
- src/components/chat/SystemMessage.tsx (audio playback controls)
```

### Code Flow for Audio Generation:

**File: `src/components/chat/SystemMessage.tsx`**
```typescript
// This component shows the generated story and handles audio generation
export function SystemMessage({ storyId, userId, content }) {
  // These store the audio state (playing, loading, error, etc.)
  const [audioState, setAudioState] = useState({
    url: null,           // URL of the audio file
    isPlaying: false,    // Is audio currently playing?
    isGenerating: false, // Are we creating audio right now?
    error: null          // Any error that happened
  });

  // This function runs when user clicks "Generate Audio" button
  const generateAudio = async () => {
    if (!storyId) return; // Can't generate audio without a story

    try {
      // Step 1: Show "Generating audio..." message
      setAudioState(prev => ({ ...prev, isGenerating: true, error: undefined }));

      // Step 2: Get authentication headers
      const { buildAuthHeaders } = await import('@/lib/request-headers');
      const headers = await buildAuthHeaders({ userId: userId });

      // Step 3: Call the audio generation API
      const response = await fetch(`/api/story/${storyId}/audio?withMusic=true`, {
        method: 'POST',
        headers
      });

      // Step 4: Check if API call was successful
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      // Step 5: Get the audio URL from the response
      const data = await response.json();

      // Step 6: If we got audio, save it and show play button
      if (data.audioUrl && data.audioUrl !== 'browser-tts') {
        setAudioState(prev => ({ 
          ...prev, 
          url: data.audioUrl,     // Save the audio URL
          isGenerating: false,    // Stop showing "Generating..."
          error: undefined        // Clear any errors
        }));
      } else {
        // If no audio available, show error
        setAudioState(prev => ({ 
          ...prev, 
          isGenerating: false,
          error: 'Audio generation not available' 
        }));
      }
    } catch (error) {
      // If something went wrong, show error message
      setAudioState(prev => ({ 
        ...prev, 
        isGenerating: false,
        error: error.message || 'Failed to generate audio'
      }));
    }
  };

  // This function plays or pauses the audio
  const togglePlayPause = () => {
    if (audioState.isPlaying) {
      audioElement?.pause(); // Stop playing
    } else {
      audioElement?.play();  // Start playing
    }
  };
}
```

**File: `src/app/api/story/[storyId]/audio/route.ts`**
```typescript
// This is the API endpoint that generates audio from stories
export async function POST(req: Request, { params }: { params: { storyId: string } }) {
  try {
    // Step 1: Check if user is signed in
    const user = await requireSupabaseUser(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { storyId } = params;

    // Step 2: Get the story from database
    const userStories = await DatabaseService.getUserStories(user.id, 100);
    const story = userStories.find(s => s.id === storyId);

    // Step 3: Check if story exists and user owns it
    if (!story) {
      return NextResponse.json({ message: 'Story not found' }, { status: 404 });
    }
    if (story.user_id !== user.id) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Step 4: Check if ElevenLabs API key is configured
    const apiKeys = hasValidApiKeys();
    if (!apiKeys.elevenLabs) {
      // If no API key, tell frontend to use browser text-to-speech
      return NextResponse.json({ 
        audioUrl: 'browser-tts',
        message: 'Using browser text-to-speech (ElevenLabs not configured)'
      });
    }

    // Step 5: Generate audio using ElevenLabs
    try {
      const elevenLabsResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB', {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',           // We want MP3 audio format
          'Content-Type': 'application/json',
          'xi-api-key': config.elevenLabsApiKey! // Our API key
        },
        body: JSON.stringify({
          text: story.output_story,         // The story text to convert
          model_id: 'eleven_monolingual_v1', // Which voice model to use
          voice_settings: {
            stability: 0.5,                 // How consistent the voice sounds
            similarity_boost: 0.5           // How similar to the original voice
          }
        })
      });

      // Step 6: Check if ElevenLabs call was successful
      if (!elevenLabsResponse.ok) {
        const errorText = await elevenLabsResponse.text();
        throw new Error(`ElevenLabs API error: ${elevenLabsResponse.status}`);
      }

      // Step 7: Convert audio to base64 format for the frontend
      const audioBuffer = await elevenLabsResponse.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');
      const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

      // Step 8: Return the audio URL to the frontend
      return NextResponse.json({ 
        audioUrl,
        message: 'Audio generated successfully'
      });

    } catch (elevenLabsError) {
      // If ElevenLabs fails, fallback to browser text-to-speech
      return NextResponse.json({ 
        audioUrl: 'browser-tts',
        message: 'Using browser text-to-speech (ElevenLabs failed)'
      });
    }

  } catch (error) {
    return NextResponse.json({ 
      message: error instanceof Error ? error.message : 'Failed to generate audio'
    }, { status: 500 });
  }
}
```

---

## 💾 Data Storage & Retrieval

### How Stories Are Saved

1. **User generates story** → Story text created by AI
   📁 Files involved: `src/app/api/story/route.ts` (story generation)

2. **API receives story** → Validates user and story data
   📁 Files involved: 
   - `src/app/api/story/route.ts` (validation logic)
   - `src/lib/server-auth.ts` (user authentication)
   - `src/lib/database-service.ts` (user data retrieval)

3. **Database insert** → Story saved to `stories` table with:
   - `user_id`: Links story to specific user
   - `input_text`: What user originally typed
   - `output_story`: AI-generated content
   - `narration_mode`: Style chosen by user
   - `created_at`: Timestamp of creation
   📁 Files involved: 
   - `src/lib/database-service.ts` (createStory function)
   - `shared/schema.ts` (database table definitions)

4. **User count updated** → `stories_generated` incremented in `users` table
   📁 Files involved: `src/lib/database-service.ts` (updateUser function)

### How Stories Are Retrieved

1. **User opens dashboard** → App calls `/api/stories` endpoint
   📁 Files involved: `src/app/dashboard/page.tsx` (dashboard initialization)

2. **API validates user** → Checks authentication
   📁 Files involved: 
   - `src/app/api/stories/route.ts` (stories API endpoint)
   - `src/lib/server-auth.ts` (authentication validation)

3. **Database query** → Gets all stories for that user
   📁 Files involved: `src/lib/database-service.ts` (getUserStories function)

4. **Results returned** → Stories sent to frontend
   📁 Files involved: `src/app/api/stories/route.ts` (API response)

5. **UI displays stories** → User sees their story history
   📁 Files involved: 
   - `src/app/dashboard/page.tsx` (story display logic)
   - `src/components/chat/RecentStoriesModal.tsx` (story history modal)

### Code for Story Retrieval:

**File: `src/app/api/stories/route.ts`**
```typescript
// This API endpoint returns all stories for the current user
export async function GET(req: Request) {
  // Step 1: Check if user is signed in
  const user = await requireSupabaseUser(req);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  
  // Step 2: Get all stories for this user from database
  const rows = await DatabaseService.getUserStories(user.id, 10); // Get 10 most recent
  
  // Step 3: Return stories to frontend
  return NextResponse.json(rows);
}
```

**File: `src/app/dashboard/page.tsx`**
```typescript
// This code runs on the dashboard to load user's stories
export default function DashboardPage() {
  // This automatically loads user stories when dashboard opens
  const { data: userStories, isLoading: storiesLoading, error: storiesError } = useQuery({
    queryKey: ['stories', user?.id], // Cache key based on user ID
    queryFn: async () => {
      if (!user) return []; // Don't load if no user
      return apiClient.get('/api/stories'); // Call the API
    },
    enabled: !!user // Only run if user exists
  });

  // Show error if stories failed to load
  useEffect(() => {
    if (storiesError) {
      setDatabaseError(storiesError.message || 'Failed to load stories');
    }
  }, [storiesError]);
}
```

---

## 🚀 Complete User Journey

### 1. **First Visit**
```
User opens app → Sees landing page → Clicks "Get Started" → Redirected to /auth
📁 Files involved: 
- src/app/page.tsx (landing page)
- src/app/auth/page.tsx (auth page)
```

### 2. **Authentication**
```
User sees Google sign-in → Clicks "Continue with Google" → Google popup → User grants permission → Supabase creates account → User redirected to /dashboard
📁 Files involved:
- src/app/auth/page.tsx (Google sign-in button)
- src/lib/supabase.ts (Supabase client)
- src/context/AuthContext.tsx (auth state management)
- src/app/auth/callback/page.tsx (OAuth callback)
```

### 3. **Dashboard Load**
```
Dashboard opens → App checks authentication → Loads user data from database → Shows empty chat interface
📁 Files involved:
- src/app/dashboard/page.tsx (dashboard page)
- src/components/auth-guard.tsx (authentication protection)
- src/app/api/me/route.ts (user data loading)
- src/lib/database-service.ts (database operations)
```

### 4. **Story Creation**
```
User types text → Selects narration mode → Clicks send → "Generating..." appears → AI creates story → Story appears in chat → User's story count incremented
📁 Files involved:
- src/app/dashboard/page.tsx (user input and story display)
- src/components/chat/ChatInput.tsx (input component)
- src/components/narration-mode-card.tsx (narration mode selection)
- src/app/api/story/route.ts (story generation API)
- src/lib/config.ts (AI prompt generation)
- src/lib/database-service.ts (story saving)
```

### 5. **Audio Generation**
```
User sees story → Clicks "Generate Audio" → "Generating audio..." appears → ElevenLabs creates audio → Play button appears → User can listen to story
📁 Files involved:
- src/components/chat/SystemMessage.tsx (story display and audio controls)
- src/app/api/story/[storyId]/audio/route.ts (audio generation API)
- src/lib/config.ts (ElevenLabs API configuration)
```

### 6. **Story History**
```
User clicks "Recent Stories" → Modal opens → Shows list of all user's stories → User can select and view previous stories
📁 Files involved:
- src/components/chat/RecentStoriesModal.tsx (story history modal)
- src/app/api/stories/route.ts (stories retrieval API)
- src/lib/database-service.ts (getUserStories function)
```

### 7. **Data Persistence**
```
All stories saved to database → User can close browser → Return later → All stories still there → User data preserved
📁 Files involved:
- src/lib/database-service.ts (all database operations)
- shared/schema.ts (database table definitions)
- src/lib/db.ts (database connection)
```

---

## 🔧 Technical Architecture Summary

### Frontend (React/Next.js)
- **Pages**: Landing, Auth, Dashboard
- **Components**: Chat interface, Story display, Audio player
- **State Management**: React hooks, TanStack Query for API calls
- **Authentication**: Supabase client-side auth

### Backend (Next.js API Routes)
- **Authentication**: `/api/me` - Get user info
- **Stories**: `/api/stories` - Get user stories, `/api/story` - Create story
- **Audio**: `/api/story/[storyId]/audio` - Generate audio
- **Health**: `/api/health` - Check system status

### Database (PostgreSQL via Supabase)
- **Users Table**: User accounts, premium status, story counts
- **Stories Table**: Generated stories, audio URLs, metadata
- **Relationships**: Stories linked to users via `user_id`

### External Services
- **Supabase**: Authentication and database hosting
- **OpenRouter**: AI story generation
- **ElevenLabs**: Text-to-speech audio generation

### Data Flow Diagram
```
User Input → Frontend → API Route → Database → External Service → Response → Frontend → User
     ↓           ↓         ↓          ↓            ↓              ↓         ↓        ↓
   "Hello" → React → /api/story → PostgreSQL → OpenRouter → "Story..." → React → Display
```

This architecture ensures that:
- ✅ User data is secure and authenticated
- ✅ Stories are saved and retrievable
- ✅ Audio generation works reliably
- ✅ The app scales with user growth
- ✅ All user actions are properly tracked and stored

---

## 📚 Complete File Mapping by Data Flow

### 🔐 Authentication Flow Files
| Step | File | Purpose | What It Does |
|------|------|---------|--------------|
| Landing | `src/app/page.tsx` | Landing page | Shows app introduction and "Get Started" button |
| Auth Page | `src/app/auth/page.tsx` | Sign-in page | Displays Google sign-in button and handles OAuth |
| Supabase Client | `src/lib/supabase.ts` | Supabase configuration | Connects to Supabase authentication service |
| Auth Context | `src/context/AuthContext.tsx` | Auth state management | Remembers who is signed in across the app |
| Auth Guard | `src/components/auth-guard.tsx` | Route protection | Protects dashboard from unauthorized access |
| OAuth Callback | `src/app/auth/callback/page.tsx` | OAuth callback | Handles Google OAuth redirect after sign-in |

### 📝 Story Generation Flow Files
| Step | File | Purpose | What It Does |
|------|------|---------|--------------|
| Dashboard | `src/app/dashboard/page.tsx` | Main interface | Where users type text and see generated stories |
| Chat Input | `src/components/chat/ChatInput.tsx` | Text input | Component for typing story prompts |
| Narration Modes | `src/components/narration-mode-card.tsx` | Style selection | Buttons for choosing story narration style |
| API Client | `src/lib/api-client.ts` | HTTP requests | Makes API calls with proper authentication |
| Story API | `src/app/api/story/route.ts` | Story generation | Creates stories using OpenRouter AI |
| Server Auth | `src/lib/server-auth.ts` | API authentication | Validates user tokens for API requests |
| Database Service | `src/lib/database-service.ts` | Database operations | Saves stories and updates user data |
| Config | `src/lib/config.ts` | API configuration | Manages API keys and generates AI prompts |

### 🎵 Audio Generation Flow Files
| Step | File | Purpose | What It Does |
|------|------|---------|--------------|
| Story Display | `src/components/chat/SystemMessage.tsx` | Story UI | Shows generated stories and audio controls |
| Request Headers | `src/lib/request-headers.ts` | Auth headers | Builds authentication headers for API calls |
| Audio API | `src/app/api/story/[storyId]/audio/route.ts` | Audio generation | Creates audio using ElevenLabs text-to-speech |
| Config | `src/lib/config.ts` | API validation | Checks if ElevenLabs API key is configured |

### 💾 Data Storage Flow Files
| Step | File | Purpose | What It Does |
|------|------|---------|--------------|
| Database Schema | `shared/schema.ts` | Table definitions | Defines users and stories table structure |
| Database Connection | `src/lib/db.ts` | DB connection | Connects to PostgreSQL database via Drizzle |
| Database Service | `src/lib/database-service.ts` | CRUD operations | All database read/write operations |
| Stories API | `src/app/api/stories/route.ts` | Story retrieval | Gets all stories for a user |
| User API | `src/app/api/me/route.ts` | User data | Gets and creates user account data |

### 🖥️ UI Components Files
| Component | File | Purpose | What It Does |
|-----------|------|---------|--------------|
| Chat Header | `src/components/chat/ChatHeader.tsx` | Top navigation | Shows user info and navigation buttons |
| User Message | `src/components/chat/UserMessage.tsx` | User input display | Shows what the user typed |
| System Message | `src/components/chat/SystemMessage.tsx` | Story display | Shows AI-generated stories and audio |
| Recent Stories | `src/components/chat/RecentStoriesModal.tsx` | Story history | Modal showing all user's previous stories |
| Settings Modal | `src/components/chat/SettingsModal.tsx` | User settings | Modal for user account settings |
| Toast Context | `src/context/ToastContext.tsx` | Notifications | Manages error and success messages |

### 🔧 Utility Files
| File | Purpose | What It Does |
|------|---------|--------------|
| `src/lib/utils.ts` | General utilities | Helper functions for the app |
| `src/hooks/use-mobile.tsx` | Mobile detection | Detects if user is on mobile device |
| `src/hooks/use-toast.ts` | Toast notifications | Hook for showing notifications |
| `src/middleware.ts` | Route middleware | Handles authentication for protected routes |

## 🗂️ File Organization Summary

```
src/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Landing page
│   ├── auth/                     # Authentication pages
│   │   ├── page.tsx             # Sign-in page
│   │   └── callback/page.tsx    # OAuth callback
│   ├── dashboard/               # Main app page
│   │   └── page.tsx            # Dashboard with chat interface
│   └── api/                     # Backend API endpoints
│       ├── health/route.ts      # Health check
│       ├── me/route.ts          # User data
│       ├── stories/route.ts     # Get user stories
│       ├── story/route.ts       # Create story
│       └── story/[storyId]/audio/route.ts # Generate audio
├── components/                   # Reusable UI components
│   ├── auth-guard.tsx           # Route protection
│   ├── chat/                    # Chat interface components
│   │   ├── ChatHeader.tsx       # Top navigation
│   │   ├── ChatInput.tsx        # Text input
│   │   ├── SystemMessage.tsx    # Story display
│   │   ├── UserMessage.tsx      # User input display
│   │   ├── RecentStoriesModal.tsx # Story history
│   │   └── SettingsModal.tsx    # User settings
│   └── ui/                      # Base UI components
├── context/                      # React context providers
│   ├── AuthContext.tsx          # Authentication state
│   └── ToastContext.tsx         # Notification state
├── hooks/                        # Custom React hooks
│   ├── use-mobile.tsx           # Mobile detection
│   └── use-toast.ts             # Toast notifications
├── lib/                          # Utility libraries
│   ├── api-client.ts            # HTTP client
│   ├── auth.ts                  # Client-side auth
│   ├── config.ts                # API configuration
│   ├── database-service.ts      # Database operations
│   ├── db.ts                    # Database connection
│   ├── request-headers.ts       # Auth headers
│   ├── server-auth.ts           # Server-side auth
│   ├── supabase.ts              # Supabase client
│   └── utils.ts                 # General utilities
└── middleware.ts                 # Route middleware
```

This comprehensive file mapping shows exactly which files are involved in each step of the data flow, making it easy for developers to understand the codebase structure and for non-technical users to see how the app is organized!
