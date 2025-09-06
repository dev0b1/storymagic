# Code Comments for Beginners - StoryMagic App

## 🎯 Purpose
This file explains what each piece of code does in simple terms, so even someone who only knows HTML can understand how the app works.

---

## 📁 File Structure Overview

```
src/
├── app/                    # Main application pages
│   ├── auth/              # Sign-in page
│   ├── dashboard/         # Main app page
│   └── api/               # Backend API endpoints
├── components/            # Reusable UI pieces
├── context/               # App-wide state management
├── lib/                   # Utility functions and services
└── hooks/                 # Custom React functions
```

---

## 🔐 Authentication Files

### `src/context/AuthContext.tsx`
**What it does**: This is like a "memory bank" that remembers who is signed in across the entire app.

```typescript
// This creates a "memory slot" to store user information
const [user, setUser] = useState(null);
// user = who is currently signed in (or null if no one)
// setUser = function to change who is signed in

// This runs when the app starts up
useEffect(() => {
  const getSession = async () => {
    // Ask Supabase: "Is anyone already signed in?"
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // Save the user info to our memory
    setUser(session?.user ?? null);
    // If session exists, save the user. If not, save null.
  };
  getSession();
}, []);
```

### `src/app/auth/page.tsx`
**What it does**: This is the sign-in page where users log in with Google.

```typescript
// This function runs when user clicks "Continue with Google"
const handleGoogleSignIn = async () => {
  // Tell Supabase to start the Google sign-in process
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',  // Use Google as the sign-in method
    options: {
      // After signing in, redirect user to this page
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
};
```

---

## 🗄️ Database Files

### `src/lib/database-service.ts`
**What it does**: This handles all database operations (saving, loading, updating data).

```typescript
// This function checks if the database is working
static async validateDatabase(): Promise<boolean> {
  try {
    // Try to read from the users table
    await db.select().from(users).limit(1);
    // This is like saying: "Get 1 user from the users table"
    
    // Try to read from the stories table  
    await db.select().from(stories).limit(1);
    // This is like saying: "Get 1 story from the stories table"
    
    return true; // If both work, database is fine
  } catch (error) {
    // If either fails, throw an error
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

// This function gets a user's information
static async getUser(userId: string) {
  try {
    // SQL equivalent: "SELECT * FROM users WHERE id = userId"
    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return rows[0] || null; // Return the user or null if not found
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
}

// This function saves a new story
static async createStory(input: {
  user_id: string;        // Who owns this story
  input_text: string;     // What the user typed
  output_story: string;   // What the AI generated
  narration_mode: string; // How the story should be told
  source: 'api' | 'pdf';  // How it was created
}) {
  try {
    // Make sure we have a story to save
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
```

---

## 📝 Story Generation Files

### `src/app/api/story/route.ts`
**What it does**: This is the API endpoint that creates stories when users submit text.

```typescript
export async function POST(req: Request) {
  try {
    // Step 1: Check if user is signed in
    const user = await requireSupabaseUser(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Step 2: Get the text and style from the request
    const body = await req.json();
    const inputText = body?.inputText?.trim(); // What user typed
    const narrationMode = body?.narrationMode || 'balanced'; // How to tell story

    // Step 3: Check if user can create more stories
    const dbUser = await DatabaseService.getUser(user.id);
    const isPremium = dbUser?.is_premium || false;
    
    // Free users limited to 10 stories
    if (!isPremium && (dbUser?.stories_generated || 0) >= 10) {
      return NextResponse.json({ 
        message: 'Free users are limited to 10 stories. Upgrade to premium!'
      }, { status: 403 });
    }

    // Step 4: Create instructions for the AI
    const systemPrompt = generateAdaptivePrompt(narrationMode);

    // Step 5: Call OpenRouter AI to generate story
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openRouterApiKey}`, // Our API key
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-small-3.2-24b-instruct:free', // Which AI to use
        messages: [
          { role: 'system', content: systemPrompt }, // Instructions for AI
          { role: 'user', content: `User input: "${inputText}"` } // User's text
        ],
        max_tokens: 800,    // Maximum length of response
        temperature: 0.7    // How creative the AI should be
      })
    });

    // Step 6: Get the generated story
    const openRouterData = await openRouterResponse.json();
    const generatedStory = openRouterData.choices?.[0]?.message?.content;

    // Step 7: Save story to database
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

    // Step 9: Return story to user
    return NextResponse.json({
      story: generatedStory,
      storyId: savedStory?.id
    });

  } catch (error) {
    return NextResponse.json({ 
      message: error.message || 'Failed to generate story'
    }, { status: 500 });
  }
}
```

---

## 🎵 Audio Generation Files

### `src/app/api/story/[storyId]/audio/route.ts`
**What it does**: This creates audio from stories using ElevenLabs text-to-speech.

```typescript
export async function POST(req: Request, { params }: { params: { storyId: string } }) {
  try {
    // Step 1: Check if user is signed in
    const user = await requireSupabaseUser(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { storyId } = params; // Which story to convert to audio

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

    // Step 4: Check if ElevenLabs API key is available
    const apiKeys = hasValidApiKeys();
    if (!apiKeys.elevenLabs) {
      // If no API key, use browser text-to-speech instead
      return NextResponse.json({ 
        audioUrl: 'browser-tts',
        message: 'Using browser text-to-speech (ElevenLabs not configured)'
      });
    }

    // Step 5: Generate audio using ElevenLabs
    const elevenLabsResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB', {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',           // We want MP3 audio
        'Content-Type': 'application/json',
        'xi-api-key': config.elevenLabsApiKey! // Our API key
      },
      body: JSON.stringify({
        text: story.output_story,         // The story text to convert
        model_id: 'eleven_monolingual_v1', // Which voice to use
        voice_settings: {
          stability: 0.5,                 // How consistent the voice sounds
          similarity_boost: 0.5           // How similar to original voice
        }
      })
    });

    // Step 6: Convert audio to base64 format
    const audioBuffer = await elevenLabsResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

    // Step 7: Return audio URL to frontend
    return NextResponse.json({ 
      audioUrl,
      message: 'Audio generated successfully'
    });

  } catch (error) {
    return NextResponse.json({ 
      message: error.message || 'Failed to generate audio'
    }, { status: 500 });
  }
}
```

---

## 🖥️ Frontend Components

### `src/app/dashboard/page.tsx`
**What it does**: This is the main page where users create and view stories.

```typescript
export default function DashboardPage() {
  // These store what the user is doing
  const [inputText, setInputText] = useState(''); // What user typed
  const [selectedNarrationMode, setSelectedNarrationMode] = useState('engaging'); // Story style
  const [chatMessages, setChatMessages] = useState([]); // All messages in chat
  const [databaseError, setDatabaseError] = useState(null); // Any database errors

  // This automatically loads user's stories when page opens
  const { data: userStories, isLoading: storiesLoading, error: storiesError } = useQuery({
    queryKey: ['stories', user?.id], // Cache key based on user ID
    queryFn: async () => {
      if (!user) return []; // Don't load if no user
      return apiClient.get('/api/stories'); // Call API to get stories
    },
    enabled: !!user // Only run if user exists
  });

  // This function runs when user clicks "Send"
  const handleSendMessage = () => {
    if (!inputText.trim()) return; // Don't send empty messages
    
    // Tell the app to generate a story
    storyMutation.mutate({
      inputText: inputText.trim(),
      narrationMode: selectedNarrationMode
    });
  };

  // This handles the story generation process
  const storyMutation = useMutation({
    // This function calls the API to generate story
    mutationFn: async ({ inputText, narrationMode }) => {
      return apiClient.post('/api/story', { inputText, narrationMode });
    },
    
    // This runs BEFORE API call - shows "Generating..." message
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
            content: data.story,    // The AI-generated story
            storyId: data.storyId,  // ID to save in database
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

### `src/components/chat/SystemMessage.tsx`
**What it does**: This component displays generated stories and handles audio generation.

```typescript
export function SystemMessage({ storyId, userId, content }) {
  // These store the audio state
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

      // Step 5: Get the audio URL from response
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

---

## 🔧 Utility Files

### `src/lib/api-client.ts`
**What it does**: This creates a client for making API calls with proper authentication.

```typescript
export function createApiClient(options: { user?: { id: string } | null }) {
  const { user } = options;
  
  // These are headers sent with every API request
  const headers: HeadersInit = {
    'Content-Type': 'application/json' // Tell server we're sending JSON
  };
  
  // Add user ID header if user is signed in
  if (user?.id) {
    headers['x-user-id'] = user.id; // Tell server which user is making the request
  }
  
  return {
    // Function to send POST requests (like creating stories)
    async post(url: string, data: any) {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data) // Convert data to JSON string
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }
      
      return response.json(); // Convert response back to JavaScript object
    },
    
    // Function to send GET requests (like loading stories)
    async get(url: string) {
      const response = await fetch(url, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }
      
      return response.json();
    }
  };
}
```

---

## 📊 Data Flow Summary

1. **User types text** → Stored in React state
2. **User clicks send** → Frontend calls API
3. **API validates user** → Checks authentication
4. **API calls AI service** → Generates story
5. **API saves to database** → Story stored permanently
6. **API returns story** → Frontend displays it
7. **User clicks audio** → Frontend calls audio API
8. **Audio API calls ElevenLabs** → Generates audio
9. **Audio returned** → User can play it

This flow ensures that:
- ✅ Only signed-in users can create stories
- ✅ Stories are saved and can be retrieved later
- ✅ Audio generation works reliably
- ✅ All user actions are properly tracked
- ✅ The app handles errors gracefully

The code is organized so that each file has a specific responsibility, making it easier to understand and maintain!
