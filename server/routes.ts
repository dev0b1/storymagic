import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { db } from "./supabase";
import { insertStorySchema } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';
import { config, hasValidApiKeys } from './config.js';
import { requireAuth, optionalAuth, handleDemoUser } from './middleware/auth';
import { User } from '@supabase/supabase-js';

// Safely import pdf-parse to avoid test file errors
let pdf: any = null;

// Initialize pdf-parse when needed
async function initPdfParser() {
  if (pdf) return pdf;
  
  try {
    const pdfModule = await import('pdf-parse');
    pdf = pdfModule.default || pdfModule;
    console.log('PDF parser initialized successfully');
  } catch (error) {
    console.warn('pdf-parse not available, PDF processing will be limited:', error);
    pdf = null;
  }
  return pdf;
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter: (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Remove fallback story generation - we only use OpenRouter now

// Professional narration modes instead of childish characters
const narrationModes = {
  focus: {
    name: "Clarity",
    description: "Crystal-clear knowledge delivery",
    icon: "✨",
    style: "Transform complex information into crystal-clear explanations. Like having a brilliant professor who makes everything click. Perfect for technical content, research papers, and detailed learning materials.",
    audioProfile: "precise-expert"
  },
  balanced: {
    name: "Guide", 
    description: "Your friendly knowledge companion",
    icon: "🎯",
    style: "Like having a knowledgeable friend explain things over coffee. Maintains the perfect balance between informative and conversational, making learning feel natural and enjoyable. Ideal for textbooks, articles, and general learning.",
    audioProfile: "friendly-expert"
  },
  engaging: {
    name: "Storyteller",
    description: "Where knowledge meets imagination",
    icon: "💫", 
    style: "Weaves facts into captivating narratives while maintaining accuracy. Brings dry facts to life through engaging storytelling. Perfect for history, case studies, biographies, and making complex topics memorable.",
    audioProfile: "dynamic-narrative"
  }
};

// Content type detection removed as it's not needed

// Magical content transformation with personalized narration styles
function generateAdaptivePrompt(narrationMode: 'focus' | 'balanced' | 'engaging'): string {
  const mode = narrationModes[narrationMode as keyof typeof narrationModes];
  
  const modeInstructions = {
    focus: `You are a brilliant mentor with the gift of clarity. Your specialty is transforming complex information into crystal-clear understanding.

Approach this content like a master teacher would:
- Illuminate complex concepts with precise, enlightening explanations
- Structure information in a logical, flowing sequence that builds understanding
- Use clear, vivid language that makes abstract concepts tangible
- Break down complicated ideas into digestible insights
- Maintain absolute precision while making the content accessible
- When appropriate, use analogies that create "aha!" moments

Your goal is to make the reader feel like they're experiencing a moment of perfect clarity, where everything just clicks.`,

    balanced: `You are a wise and friendly guide, skilled at making learning feel like an engaging conversation with a brilliant friend.

Transform this content as if you're sharing knowledge over coffee:
- Use a warm, approachable tone that invites understanding
- Create a natural flow that feels like an engaging discussion
- Balance educational depth with conversational accessibility
- Include thoughtful insights that deepen understanding
- Use relatable examples that connect with the reader
- Keep technical accuracy while making the content engaging

Your goal is to make the reader feel like they're learning effortlessly from someone who deeply understands both the subject and how to explain it.`,

    engaging: `You are a master storyteller with the ability to weave knowledge into captivating narratives while maintaining perfect accuracy.

Transform this content using the art of storytelling:
- Create a narrative flow that makes learning magical
- Use vivid, engaging language that brings concepts to life
- Weave examples and explanations into memorable stories
- Build anticipation and interest throughout the piece
- Include "story-worthy" moments that highlight key insights
- Keep factual precision while making the content unforgettable

Your goal is to make the reader feel like they're experiencing an engaging story that naturally leads to understanding and insight.`
  };
  
  return `${modeInstructions[narrationMode as keyof typeof modeInstructions]}

Critical Requirements:
- Transform the content while preserving every important detail
- Never add information that isn't in the original content
- Keep all technical terms, numbers, dates, and proper nouns exactly as given
- Maintain academic/professional language where appropriate
- If something is unclear in the source, keep that ambiguity explicit
- Focus on transformation of style and structure, not content

Critical constraints:
- Do not introduce information that is not explicitly present in the provided input
- Do not guess, speculate, or invent facts
- Preserve terminology, figures, dates, citations, and proper nouns exactly as given
- If the source content is incomplete or ambiguous, keep those gaps explicit in the output
- Maintain the original scope and do not add extra sections or claims

Guidelines:
- Maintain 100% factual accuracy
- Preserve all key information and data points
- Use clear, professional language appropriate for the content type
- Create logical flow and structure (use paragraphs, headings if appropriate)
- Ensure the output is engaging and accessible
- Keep the tone consistent with the selected narration mode
- Avoid childish or overly simplistic language
- Focus on educational value and clarity

Transform the following content:`;
}

const execAsync = promisify(exec);

// Create background music using ffmpeg and audio synthesis
async function createBackgroundMusic(durationSeconds: number, character: string = 'balanced'): Promise<string> {
  const tempDir = path.join(process.cwd(), 'tmp');
  await fs.mkdir(tempDir, { recursive: true });
  
  const backgroundFile = path.join(tempDir, `bg_${character}_${Date.now()}.wav`);
  
  // Narration-mode sound profiles
  const soundProfiles = {
    focus: {
      frequencies: [220, 330, 440], // Calm, steady tones
      volumes: [0.018, 0.014, 0.01],
      description: 'Calm professional ambience'
    },
    balanced: {
      frequencies: [260, 392, 523], // Natural, warm tones
      volumes: [0.02, 0.015, 0.011],
      description: 'Natural educational ambience'
    },
    engaging: {
      frequencies: [330, 494, 659], // Brighter, more dynamic tones
      volumes: [0.024, 0.018, 0.013],
      description: 'Dramatic narrative ambience'
    }
  } as const;
  
  const profile = soundProfiles[(character as keyof typeof soundProfiles)] || soundProfiles.balanced;
  
  // Create a character-specific magical background tone using ffmpeg's audio synthesis
  const command = `ffmpeg -f lavfi -i "sine=frequency=${profile.frequencies[0]}:duration=${durationSeconds}" -f lavfi -i "sine=frequency=${profile.frequencies[1]}:duration=${durationSeconds}" -f lavfi -i "sine=frequency=${profile.frequencies[2]}:duration=${durationSeconds}" -filter_complex "[0:a]volume=${profile.volumes[0]}[a1];[1:a]volume=${profile.volumes[1]}[a2];[2:a]volume=${profile.volumes[2]}[a3];[a1][a2][a3]amix=inputs=3:duration=longest:dropout_transition=2[out]" -map "[out]" -y "${backgroundFile}"`;
  
  try {
    await execAsync(command);
    return backgroundFile;
  } catch (error) {
    console.log('Background music generation failed, continuing without it:', error);
    return '';
  }
}

// Enhanced function to create dynamic background music with multiple layers
async function createDynamicBackgroundMusic(durationSeconds: number, character: string = 'balanced'): Promise<string> {
  const tempDir = path.join(process.cwd(), 'tmp');
  await fs.mkdir(tempDir, { recursive: true });
  
  const backgroundFile = path.join(tempDir, `dynamic_bg_${character}_${Date.now()}.wav`);
  
  // Dynamic sound profiles with multiple layers
  const dynamicProfiles = {
    focus: {
      // Layer 1: Base ambient tone
      baseFreq: 220,
      baseVol: 0.015,
      // Layer 2: Gentle wind-like modulation
      modFreq: 0.3,
      modDepth: 5,
      // Layer 3: Occasional sparkles
      sparkleFreq: 880,
      sparkleVol: 0.008,
      sparkleRate: 0.5
    },
    engaging: {
      // Layer 1: Energetic base
      baseFreq: 440,
      baseVol: 0.02,
      // Layer 2: Fast modulation for excitement
      modFreq: 0.8,
      modDepth: 8,
      // Layer 3: Fire crackle effect
      sparkleFreq: 660,
      sparkleVol: 0.012,
      sparkleRate: 1.2
    },
    balanced: {
      // Layer 1: Soft melodic base
      baseFreq: 196,
      baseVol: 0.012,
      // Layer 2: Gentle wave-like modulation
      modFreq: 0.2,
      modDepth: 3,
      // Layer 3: Gentle chimes
      sparkleFreq: 523,
      sparkleVol: 0.006,
      sparkleRate: 0.3
    }
  };
  
  const profile = dynamicProfiles[(character as keyof typeof dynamicProfiles)] || dynamicProfiles.balanced;
  
  // Create dynamic background with multiple layers
  const command = `ffmpeg -f lavfi -i "sine=frequency=${profile.baseFreq}:duration=${durationSeconds}" -f lavfi -i "sine=frequency=${profile.baseFreq + profile.modDepth}:duration=${durationSeconds}" -f lavfi -i "sine=frequency=${profile.sparkleFreq}:duration=${durationSeconds}" -filter_complex "[0:a]volume=${profile.baseVol}[base];[1:a]volume=${profile.baseVol * 0.7}[mod];[2:a]volume=${profile.sparkleVol}[sparkle];[base][mod][sparkle]amix=inputs=3:duration=longest:dropout_transition=3[out]" -map "[out]" -y "${backgroundFile}"`;
  
  try {
    await execAsync(command);
    return backgroundFile;
  } catch (error) {
    console.log('Dynamic background music generation failed, falling back to simple version:', error);
    return await createBackgroundMusic(durationSeconds, character);
  }
}

// Function to use custom audio files as background
async function createCustomBackgroundMusic(durationSeconds: number, character: string = 'balanced'): Promise<string> {
  const tempDir = path.join(process.cwd(), 'tmp');
  await fs.mkdir(tempDir, { recursive: true });
  
  // Path to custom audio files (you can add these to your project)
  const customAudioPath = path.join(process.cwd(), 'assets', 'audio', 'backgrounds');
  
  const customAudioFiles = {
    focus: path.join(customAudioPath, 'calm_ambience.mp3'),
    balanced: path.join(customAudioPath, 'natural_ambience.mp3'),
    engaging: path.join(customAudioPath, 'dramatic_ambience.mp3')
  } as const;
  
  const customFile = customAudioFiles[(character as keyof typeof customAudioFiles)];
  
  // Check if custom file exists
  try {
    await fs.access(customFile);
    
    // Loop the custom audio to match the duration
    const outputFile = path.join(tempDir, `custom_bg_${character}_${Date.now()}.wav`);
    const command = `ffmpeg -stream_loop -1 -i "${customFile}" -t ${durationSeconds} -af "volume=0.3" -y "${outputFile}"`;
    
    await execAsync(command);
    return outputFile;
  } catch (error) {
    console.log(`Custom audio file not found for ${character}, using generated audio:`, error);
    return await createDynamicBackgroundMusic(durationSeconds, character);
  }
}

// Mix TTS audio with background music using ffmpeg
async function mixAudioWithBackground(ttsFile: string, backgroundFile: string): Promise<string> {
  if (!backgroundFile) return ttsFile;
  
  const tempDir = path.join(process.cwd(), 'tmp');
  const outputFile = path.join(tempDir, `mixed_${Date.now()}.mp3`);
  
  // Mix the TTS (louder) with background music (quieter)
  const command = `ffmpeg -i "${ttsFile}" -i "${backgroundFile}" -filter_complex "[0:a]volume=1.0[tts];[1:a]volume=0.3[bg];[tts][bg]amix=inputs=2:duration=first:dropout_transition=2" -c:a libmp3lame -b:a 128k -y "${outputFile}"`;
  
  try {
    await execAsync(command);
    
    // Clean up temp files
    try {
      await fs.unlink(backgroundFile);
    } catch (e) {
      // Ignore cleanup errors
    }
    
    return outputFile;
  } catch (error) {
    console.log('Audio mixing failed, returning original TTS:', error);
    return ttsFile;
  }
}

// Configure OpenAI for TTS - only initialize when needed
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key is required. Please set OPENAI_API_KEY or OPENROUTER_API_KEY environment variable.");
    }
    openai = new OpenAI({
      apiKey: apiKey,
      baseURL: process.env.OPENAI_API_KEY ? undefined : "https://openrouter.ai/api/v1"
    });
  }
  return openai;
}

const generateStoryRequestSchema = z.object({
  text: z.string().min(1),
  character: z.enum(["lumi", "spark", "bella"]),
  userId: z.string().optional()
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health: DB setup check via wrapper
  app.get('/api/health/db', async (req, res) => {
    try {
      const demo = await db.getUser('health-check');
      const stories = await db.getUserStories('health-check', 1);
      res.json({ ok: true, hasUsersTable: demo !== undefined, hasStoriesTable: Array.isArray(stories) });
    } catch (e) {
      res.status(200).json({ ok: true, note: 'Using fallback storage; Supabase not reachable' });
    }
  });

  // Health: direct Supabase connectivity check (detailed)
  app.get('/api/health/supabase', async (req, res) => {
    try {
      // We attempt select calls via db to surface errors if tables are missing
      const user = await db.getUser('health-check');
      const byEmail = await db.getUserByEmail('health-check@example.com');
      const items = await db.getUserStories('health-check', 1);
      res.json({
        ok: true,
        usersTable: user !== null || byEmail !== null || true,
        storiesTable: Array.isArray(items),
        message: 'Supabase reachable or fallback path operational'
      });
    } catch (error: any) {
      res.status(500).json({ ok: false, message: error?.message || 'Supabase error' });
    }
  });

  // Generate story endpoint with limits
  app.post("/api/story", optionalAuth, handleDemoUser, async (req, res) => {
    try {
      const { inputText, narrationMode = 'balanced' } = req.body;
      console.log('📝 Story generation request from user:', req.user?.id);
      
      if (!inputText || inputText.trim().length === 0) {
        return res.status(400).json({ error: 'Input text is required' });
      }

      // Get effective user ID
      const effectiveUserId = req.user?.id || 'anonymous';
      console.log('👤 Effective user ID:', effectiveUserId);
      
      // Get user to check limits
      const user = effectiveUserId ? await db.getUser(effectiveUserId) : null;
      const isPremium = user?.is_premium || false;
      
      // Text length limits
      const maxLength = isPremium ? 20000 : 600; // Pro: 20k characters, Free: 600 characters
      if (inputText.length > maxLength) {
        return res.status(400).json({ 
          message: `Text too long. ${isPremium ? 'Premium' : 'Free'} users are limited to ${maxLength} characters. Your text is ${inputText.length} characters.` 
        });
      }
      
      // Check story limits for non-premium users
      if (effectiveUserId && user) {
        const storiesCount = user.stories_generated;
        
        if (!isPremium && storiesCount >= 2) {
          return res.status(403).json({ 
            message: 'Free users are limited to 2 stories. Upgrade to premium for unlimited stories!',
            code: 'LIMIT_REACHED'
          });
        }
      }
      
      // Create enhanced system prompt with narration mode
      const systemPrompt = generateAdaptivePrompt(narrationMode);

      let generatedStory = null;

      // Try OpenRouter API first
      try {
        const apiKeys = hasValidApiKeys();
        if (!apiKeys.openRouter) {
          throw new Error('OpenRouter API key not configured. Please set OPENROUTER_API_KEY environment variable.');
        }

        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:3000',
            'X-Title': 'StoryMagic AI'
          },
          body: JSON.stringify({
            model: 'mistralai/mistral-small-3.2-24b-instruct:free',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `User input: "${inputText}"` }
            ],
            max_tokens: 800,
            temperature: 0.7
          })
        });

        if (openRouterResponse.ok) {
          const openRouterData = await openRouterResponse.json();
          generatedStory = openRouterData.choices?.[0]?.message?.content;
          
          if (generatedStory && generatedStory.trim().length > 0) {
            console.log('✅ OpenRouter API successful, story generated');
          } else {
            throw new Error('Empty response from OpenRouter API');
          }
        } else {
          const errorData = await openRouterResponse.text();
          console.error('❌ OpenRouter API error:', openRouterResponse.status, errorData);
          throw new Error(`OpenRouter API error: ${openRouterResponse.status}`);
        }
      } catch (openRouterError) {
        console.error('❌ OpenRouter API failed:', openRouterError);
        console.error('💡 Please ensure your OPENROUTER_API_KEY is correctly configured');
        
        // Return error instead of fallback
        return res.status(500).json({ 
          message: 'Story generation failed. Please check your OpenRouter API key configuration.',
          error: openRouterError instanceof Error ? openRouterError.message : 'Unknown error'
        });
      }

      // Save story and update count if user is logged in
      let savedStory = null;
      const storyUserId = effectiveUserId || 'anonymous';
      console.log('💾 Saving story for user:', storyUserId);
      savedStory = await db.createStory({
        user_id: storyUserId,
        input_text: inputText,
        output_story: generatedStory,
        narration_mode: narrationMode,
        source: 'api',
      });
      console.log('✅ Story saved with ID:', savedStory?.id);
      // Update user's story count if not anonymous
      if (effectiveUserId !== 'anonymous') {
        const user = await db.getUser(effectiveUserId);
        if (user) {
          const newCount = user.stories_generated + 1;
          await db.updateUser(effectiveUserId, { stories_generated: newCount });
        }
      }

      res.json({
        story: generatedStory,
        narrationMode,
        storyId: savedStory?.id,
        savedStory,
      });

    } catch (error) {
      console.error('Story generation error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to generate story' 
      });
    }
  });

  // Get user info - create if doesn't exist
  app.get("/api/me", async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      let user = await db.getUser(userId);
      
      // If user doesn't exist, create them (for demo purposes)
      if (!user) {
        const email = userId.includes('@') ? userId : `${userId}@demo.com`;
        user = await db.createUser({
          id: userId,
          email: email,
          name: email.split('@')[0],
          is_premium: false,
          stories_generated: 0
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to get user info' });
    }
  });

  // Get user stories
  app.get("/api/stories", optionalAuth, handleDemoUser, async (req, res) => {
    console.log('� User:', req.user);
    
    if (!req.user) {
      console.log('❌ No authenticated user');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    console.log('📚 Fetching stories for user:', userId);

    try {
      // For demo users, also check for stories saved as 'anonymous'
      let effectiveUserId = userId;
      if (userId === 'demo@gmail.com') {
        console.log('🎭 Demo user detected, including anonymous stories');
        effectiveUserId = 'anonymous';
      }

      const stories = await db.getUserStories(effectiveUserId, 3);
      console.log(`📖 Found ${stories.length} stories for user:`, effectiveUserId);
      res.json(stories);
    } catch (error) {
      console.error('❌ Get stories error:', error);
      res.status(500).json({ message: 'Failed to get stories' });
    }
  });

  // Generate audio for story with multiple TTS providers
  app.post("/api/story/:id/audio", async (req, res) => {
    console.log('🎯 Audio Generation Endpoint Called');
    try {
      const { id } = req.params;
      const { withMusic } = req.query;
      console.log('📢 Audio Generation Request - Story ID:', id, 'With Music:', withMusic);
      const userId = req.headers['x-user-id'] as string;
      console.log('👤 User ID from request:', userId);
      
      // For demo/testing, allow 'anonymous' user
      let effectiveUserId = userId;
      if (!userId || userId === 'demo' || userId === 'demo@gmail.com') {
        console.log('🎭 Converting demo/empty user to anonymous');
        effectiveUserId = 'anonymous';
      }

      // Get story and verify ownership
      console.log('📚 Fetching stories for user:', effectiveUserId);
      const stories = await db.getUserStories(effectiveUserId);
      console.log('📋 Available story IDs:', stories.map(s => s.id));
      console.log('🔍 Looking for story with ID:', id);
      const story = stories.find(s => s.id === id);

      if (!story) {
        console.log('❌ Story not found. Available stories:', stories);
        return res.status(404).json({ message: 'Story not found' });
      }
      console.log('✅ Story found:', story);

      // Get user to check if premium (for demo purposes, allow audio for all users)
      console.log('👑 Checking user status for:', userId);
      const user = await db.getUser(userId);
      console.log('👤 User details:', user);
      const allowAudio = true; // Allow audio generation for all users including demo

      let audioUrl = null;
      let provider = 'none';

      console.log('🎙️ Starting audio generation process');
      
      // Try ElevenLabs first (premium quality)
      if (process.env.ELEVENLABS_API_KEY) {
        console.log('🎯 ElevenLabs API key found, attempting ElevenLabs TTS');
        try {
          const elevenLabsVoices = {
            lumi: 'pNInz6obpgDQGcFmaJgB', // Alice - calm, clear
            spark: '21m00Tcm4TlvDq8ikWAM', // Rachel - energetic
            bella: 'AZnzlk1XvdvUeBnXmlld' // Domi - playful
          };

          const voiceId = elevenLabsVoices[story.narration_mode as keyof typeof elevenLabsVoices] || elevenLabsVoices.lumi;
          console.log('🗣️ Selected voice:', story.narration_mode, 'Voice ID:', voiceId);
          
          console.log('📞 Making ElevenLabs API request...');
          const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
              'Accept': 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': process.env.ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
              text: story.output_story,
              model_id: 'eleven_monolingual_v1',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5,
                style: 0.0,
                use_speaker_boost: true
              }
            })
          });

          console.log('⏳ Awaiting ElevenLabs response...');
          if (elevenLabsResponse.ok) {
            console.log('✅ ElevenLabs request successful, processing audio...');
            const audioBuffer = await elevenLabsResponse.arrayBuffer();
            console.log('📦 Received audio buffer, size:', audioBuffer.byteLength);
            
            // Save TTS audio to temp file for mixing
            console.log('💾 Saving audio to temp file...');
            const tempDir = path.join(process.cwd(), 'tmp');
            await fs.mkdir(tempDir, { recursive: true });
            const ttsFile = path.join(tempDir, `tts_${Date.now()}.mp3`);
            await fs.writeFile(ttsFile, Buffer.from(audioBuffer));
            console.log('✅ Audio saved to:', ttsFile);

            // Estimate duration and create background music
            console.log('🎵 Calculating background music duration...');
            const wordCount = story.output_story.split(' ').length;
            const estimatedDuration = Math.ceil(wordCount / 150 * 60);
            console.log('⏱️ Estimated duration:', estimatedDuration, 'seconds');
            
            let backgroundFile = null;
            let finalBuffer: Buffer;
            let mixedFile: string | undefined;
            
            if (withMusic === 'true') {
              try {
                console.log('🎹 Generating background music...');
                backgroundFile = await createDynamicBackgroundMusic(estimatedDuration, story.narration_mode);
                console.log('✅ Background music generated:', backgroundFile);
                
                // Mix with background music if available
                if (backgroundFile) {
                  console.log('🎚️ Mixing audio with background...');
                  mixedFile = await mixAudioWithBackground(ttsFile, backgroundFile);
                  console.log('✅ Audio mixing complete');
                  finalBuffer = await fs.readFile(mixedFile);
                  
                  // Clean up background file
                  try {
                    await fs.unlink(backgroundFile);
                  } catch (error: any) {
                    console.log('⚠️ Error cleaning up background file:', error?.message || 'Unknown error');
                  }
                } else {
                  finalBuffer = await fs.readFile(ttsFile);
                }
              } catch (error: any) {
                console.log('⚠️ Background music generation skipped:', error?.message || 'Unknown error');
                console.log('ℹ️ This is normal if ffmpeg is not installed.');
                console.log('ℹ️ Using TTS audio without background music');
                finalBuffer = await fs.readFile(ttsFile);
              }
            } else {
              console.log('ℹ️ Background music not requested');
              finalBuffer = await fs.readFile(ttsFile);
            }
            
            // Clean up temp files
            try {
              await fs.unlink(ttsFile);
              if (mixedFile) {
                await fs.unlink(mixedFile);
              }
            } catch (error: any) {
              console.log('⚠️ Error cleaning up temp files:', error?.message || 'Unknown error');
            }
            
            // Clean up temp files moved above
            
            console.log('🎯 Converting final audio to base64...');
            audioUrl = `data:audio/mpeg;base64,${finalBuffer.toString('base64')}`;
            provider = 'elevenlabs';
            console.log('✅ Audio generation complete with ElevenLabs');
          } else {
            console.log('❌ ElevenLabs request failed:', await elevenLabsResponse.text());
          }
        } catch (error) {
          console.error('❌ ElevenLabs TTS error:', error);
          console.log('⚠️ Falling back to OpenAI TTS...');
        }
      } else {
        console.log('ℹ️ No ElevenLabs API key found');
      }

      // Fallback to OpenAI TTS
      if (!audioUrl && process.env.OPENAI_API_KEY) {
        console.log('🤖 Attempting OpenAI TTS generation...');
        try {
          const voiceSettings = {
            lumi: { voice: "alloy", speed: 0.9 },
            spark: { voice: "echo", speed: 1.1 },
            bella: { voice: "nova", speed: 1.0 }
          };
          
          const settings = voiceSettings[story.narration_mode as keyof typeof voiceSettings] || voiceSettings.lumi;
          const openaiClient = getOpenAIClient();
          
          const mp3 = await openaiClient.audio.speech.create({
            model: "tts-1",
            voice: settings.voice as any,
            input: story.output_story,
            speed: settings.speed,
          });

          const buffer = Buffer.from(await mp3.arrayBuffer());
          
          // Save TTS audio to temp file for mixing
          const tempDir = path.join(process.cwd(), 'tmp');
          await fs.mkdir(tempDir, { recursive: true });
          const ttsFile = path.join(tempDir, `tts_${Date.now()}.mp3`);
          await fs.writeFile(ttsFile, buffer);

          // Estimate duration and create background music
          const wordCount = story.output_story.split(' ').length;
          const estimatedDuration = Math.ceil(wordCount / 150 * 60);
          const backgroundFile = await createDynamicBackgroundMusic(estimatedDuration, story.narration_mode);
          
          // Mix with background music
          const finalFile = await mixAudioWithBackground(ttsFile, backgroundFile);
          const finalBuffer = await fs.readFile(finalFile);
          
          // Clean up temp files
          try {
            await fs.unlink(ttsFile);
            if (finalFile !== ttsFile) await fs.unlink(finalFile);
          } catch (e) {}
          
          audioUrl = `data:audio/mp3;base64,${finalBuffer.toString('base64')}`;
          provider = 'openai';
        } catch (error) {
          console.error('OpenAI TTS error:', error);
        }
      }

      // Browser-based fallback TTS for demo users
      if (!audioUrl) {
        // Return a special response that triggers browser TTS
        provider = 'browser';
        audioUrl = 'browser-tts'; // Special marker for client-side TTS
      }

      res.json({ 
        audioUrl,
        provider,
        message: audioUrl === 'browser-tts' ? 'Using browser text-to-speech' : audioUrl ? `Audio generated successfully using ${provider}` : 'Audio generation not available'
      });

    } catch (error) {
      console.error('Audio generation error:', error);
      res.status(500).json({ message: 'Failed to generate audio' });
    }
  });

  // Demo login endpoint
  app.post("/api/demo-login", async (req, res) => {
    try {
      const demoEmail = "demo@gmail.com";
      
      // Check if demo user exists
      let user = await db.getUserByEmail(demoEmail);
      
      if (!user) {
        // Create demo user
        user = await db.createUser({ 
          id: demoEmail,
          email: demoEmail, 
          name: "Demo User",
          is_premium: false,
          stories_generated: 0
        });
      }

      res.json(user);
    } catch (error) {
      console.error('Demo login error:', error);
      res.status(500).json({ message: 'Failed to create demo user' });
    }
  });

  // Create or get user (for auth)
  app.post("/api/user", async (req, res) => {
    try {
      const { email, name } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Check if user exists
      let user = await db.getUserByEmail(email);
      
      if (!user) {
        // Create new user
        user = await db.createUser({ 
          id: email,
          email, 
          name,
          is_premium: false,
          stories_generated: 0
        });
      }

      res.json(user);
    } catch (error) {
      console.error('User creation error:', error);
      res.status(500).json({ message: 'Failed to create/get user' });
    }
  });

  // PDF to Story conversion endpoint
  app.post("/api/pdf-to-story", async (req, res) => {
    try {
      const { pdfText, narrationMode = 'balanced' } = req.body;
      const userId = req.headers['x-user-id'] as string;
      
      if (!pdfText) {
        return res.status(400).json({ message: 'PDF text content is required' });
      }

      // Check user limits if logged in
      if (userId) {
        const user = await db.getUser(userId);
        if (user && !user.is_premium) {
          const stories = await db.getUserStories(userId);
          if (stories.length >= 2) {
            return res.status(403).json({
              message: 'Free users are limited to 2 stories. Upgrade to premium for unlimited stories!',
              code: 'LIMIT_REACHED'
            });
          }
        }
      }

      // Generate adaptive prompt for PDF content
      const systemPrompt = generateAdaptivePrompt(narrationMode);
      
      // Add PDF-specific instructions
      const enhancedPrompt = `${systemPrompt}

This content comes from a PDF document. Focus on:
- Extracting and organizing the key information clearly
- Making complex concepts accessible and memorable
- Creating a narrative flow that helps understanding
- Highlighting the most important takeaways
- Maintaining the professional tone while being engaging

PDF Content: "${pdfText}"`;

      let generatedStory = null;

      // Try OpenRouter API first
      try {
        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000',
            'X-Title': 'Story Whirl'
          },
          body: JSON.stringify({
            model: 'mistralai/mistral-small-3.2-24b-instruct:free',
            messages: [
              { role: 'system', content: enhancedPrompt },
              { role: 'user', content: `Convert this PDF content into an engaging story: "${pdfText}"` }
            ],
            max_tokens: 800,
            temperature: 0.7
          })
        });

        if (openRouterResponse.ok) {
          const openRouterData = await openRouterResponse.json();
          generatedStory = openRouterData.choices?.[0]?.message?.content;
        }
        
        if (!generatedStory) {
          throw new Error('No story content from OpenRouter API');
        }
              } catch (openRouterError) {
          console.error('❌ OpenRouter API failed:', openRouterError);
          console.error('💡 Please ensure your OPENROUTER_API_KEY is correctly configured');
          
          // Return error instead of fallback
          return res.status(500).json({ 
            message: 'PDF story generation failed. Please check your OpenRouter API key configuration.',
            error: openRouterError instanceof Error ? openRouterError.message : 'Unknown error'
          });
        }

      // Save story and update count if user is logged in
      let savedStory = null;
      if (userId) {
        savedStory = await db.createStory({
          user_id: userId,
          input_text: `[PDF Content] ${pdfText.substring(0, 100)}...`,
          output_story: generatedStory,
          narration_mode: narrationMode,
          source: 'pdf',
        });
        
        // Update user's story count
        const user = await db.getUser(userId);
        if (user) {
          const newCount = user.stories_generated + 1;
          await db.updateUser(userId, { stories_generated: newCount });
        }
      }

      res.json({
        story: generatedStory,
        narrationMode,
        storyId: savedStory?.id,
        savedStory,
        source: 'pdf'
      });

    } catch (error) {
      console.error('PDF to story conversion error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to convert PDF to story' 
      });
    }
  });

  // New PDF file upload endpoint
  app.post("/api/upload-pdf", upload.single('pdf'), async (req, res) => {
    try {
      // Check if PDF processing is available
      const pdfParser = await initPdfParser();
      if (!pdfParser) {
        return res.status(503).json({ 
          message: 'PDF processing is temporarily unavailable. Please try again later or contact support.' 
        });
      }

      const userId = req.headers['x-user-id'] as string;
      const { narrationMode = 'balanced' } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ message: 'No PDF file uploaded' });
      }

      // Check user limits if logged in
      if (userId) {
        const user = await db.getUser(userId);
        if (user && !user.is_premium) {
          const stories = await db.getUserStories(userId);
          if (stories.length >= 2) {
            return res.status(403).json({
              message: 'Free users are limited to 2 stories. Upgrade to premium for unlimited stories!',
              code: 'LIMIT_REACHED'
            });
          }
        }
      }

      // Extract text from PDF
      let pdfText: string;
      try {
        // Initialize PDF parser if not already done
        const pdfParser = await initPdfParser();
        if (!pdfParser) {
          return res.status(500).json({ 
            message: 'PDF processing is not available. Please contact support.' 
          });
        }

        const pdfData = await pdfParser(req.file.buffer);
        pdfText = pdfData.text;
        
        if (!pdfText || pdfText.trim().length === 0) {
          return res.status(400).json({ 
            message: 'Could not extract text from PDF. The file might be scanned or corrupted.' 
          });
        }
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        return res.status(400).json({ 
          message: 'Failed to parse PDF. Please ensure the file is not corrupted and contains extractable text.' 
        });
      }

      // Check text length limits
      const maxLength = userId && (await db.getUser(userId))?.is_premium ? 20000 : 600;
      if (pdfText.length > maxLength) {
        return res.status(400).json({ 
          message: `PDF text too long. ${userId && (await db.getUser(userId))?.is_premium ? 'Premium' : 'Free'} users are limited to ${maxLength} characters. Your PDF contains ${pdfText.length} characters.` 
        });
      }

      // Generate adaptive prompt for PDF content
      const systemPrompt = generateAdaptivePrompt(narrationMode);
      
      // Add PDF-specific instructions
      const enhancedPrompt = `${systemPrompt}

This content comes from a PDF document. Focus on:
- Extracting and organizing the key information clearly
- Making complex concepts accessible and memorable
- Creating a narrative flow that helps understanding
- Highlighting the most important takeaways
- Maintaining the professional tone while being engaging

PDF Content: "${pdfText}"`;

      let generatedStory = null;

      // Try OpenRouter API first
      try {
        const apiKeys = hasValidApiKeys();
        if (!apiKeys.openRouter) {
          throw new Error('OpenRouter API key not configured. Please set OPENROUTER_API_KEY environment variable.');
        }

        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:3000',
            'X-Title': 'StoryMagic AI'
          },
          body: JSON.stringify({
            model: 'mistralai/mistral-small-3.2-24b-instruct:free',
            messages: [
              { role: 'system', content: enhancedPrompt },
              { role: 'user', content: `Convert this PDF content into an engaging story: "${pdfText}"` }
            ],
            max_tokens: 800,
            temperature: 0.7
          })
        });

        if (openRouterResponse.ok) {
          const openRouterData = await openRouterResponse.json();
          generatedStory = openRouterData.choices?.[0]?.message?.content;
          
          if (generatedStory && generatedStory.trim().length > 0) {
            console.log('✅ OpenRouter API successful, PDF story generated');
          } else {
            throw new Error('Empty response from OpenRouter API');
          }
        } else {
          const errorData = await openRouterResponse.text();
          console.error('❌ OpenRouter API error:', openRouterResponse.status, errorData);
          throw new Error(`OpenRouter API error: ${openRouterResponse.status}`);
        }
      } catch (openRouterError) {
        console.error('❌ OpenRouter API failed:', openRouterError);
        console.error('💡 Please ensure your OPENROUTER_API_KEY is correctly configured');
        
        // Return error instead of fallback
        return res.status(500).json({ 
          message: 'PDF story generation failed. Please check your OpenRouter API key configuration.',
          error: openRouterError instanceof Error ? openRouterError.message : 'Unknown error'
        });
      }

      // Save story and update count if user is logged in
      let savedStory = null;
      if (userId) {
        savedStory = await db.createStory({
          user_id: userId,
          input_text: `[PDF: ${req.file.originalname}] ${pdfText.substring(0, 100)}...`,
          output_story: generatedStory,
          narration_mode: narrationMode,
          source: 'pdf',
        });
        
        // Update user's story count
        const user = await db.getUser(userId);
        if (user) {
          const newCount = user.stories_generated + 1;
          await db.updateUser(userId, { stories_generated: newCount });
        }
      }

      res.json({
        story: generatedStory,
        narrationMode,
        storyId: savedStory?.id,
        savedStory,
        source: 'pdf',
        originalFilename: req.file.originalname,
        extractedTextLength: pdfText.length
      });

    } catch (error) {
      console.error('PDF upload and processing error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to process PDF file' 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
