import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { db, supabase } from "./supabase";
import { insertStorySchema } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';
import { config, hasValidApiKeys } from './config.js';
import { requireAuth, optionalAuth } from './middleware/auth';
import { User } from '@supabase/supabase-js';
import type { User as DbUser } from '@shared/schema';
import { lemonSqueezyService } from './services/lemonsqueezy.js';
import { createClient as createServerSupabaseClient } from '@supabase/supabase-js';

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
function generateAdaptivePrompt(narrationMode: 'focus' | 'balanced' | 'engaging' | 'doc_theatre'): string {
  const mode = narrationModes[narrationMode as keyof typeof narrationModes];
  
  const modeInstructions = {
    focus: `You are an expert lecturer creating a clear, structured audio lesson.

Produce a lecture that:
- Starts with a 1-2 sentence objective (what the listener will learn)
- Breaks content into short, logical sections with concise explanations
- Uses simple examples or analogies where helpful (without inventing facts)
- Summarizes key takeaways at the end

Tone: professional, calm, concise. Do not add information not present in the source.`,

    balanced: `You are a friendly guide explaining the material conversationally.

Produce a guide that:
- Explains concepts plainly with natural transitions
- Balances brevity with clarity, avoids unnecessary fluff
- Keeps the content accurate to the source

Tone: approachable, helpful, focused on clarity without storytelling flourishes.`,

    engaging: `You are a factual narrator crafting an engaging narrative while preserving accuracy.

Produce a narrative that:
- Weaves the material into a flowing story structure (setup → development → concise resolution)
- Uses vivid but precise language that never invents facts
- Emphasizes memorable moments and insights already present in the source

Tone: engaging and professional; do not dramatize beyond the source content.`,
    
    doc_theatre: `You are producing a multi-voice podcast episode (host + 2–3 guests) based strictly on the source.

Produce a podcast script that:
- Includes a Host and 2–3 Guests (assign sensible roles like Researcher, Practitioner, Analyst)
- Alternates speakers with brief, natural interjections; short overlaps can be marked as (overlapping)
- Optionally include subtle cue markers like [SFX: soft_intro] or [BG: studio] where clearly appropriate
- Always remains faithful to the source; never add facts

Tone: natural roundtable conversation, concise and informative.`
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
- Use clear, professional language appropriate for the selected mode
- Create logical flow and structure
- Keep the tone consistent with the selected narration mode

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
    },
    doc_theatre: {
      frequencies: [180, 270, 450, 680], // Rich podcast studio frequencies
      volumes: [0.008, 0.012, 0.015, 0.006],
      description: 'Professional podcast studio ambience'
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

// Enhanced function to create dynamic background music with multiple layers and ambient sounds
async function createDynamicBackgroundMusic(durationSeconds: number, character: string = 'balanced', ambientType: string = 'none'): Promise<string> {
  const tempDir = path.join(process.cwd(), 'tmp');
  await fs.mkdir(tempDir, { recursive: true });
  
  const backgroundFile = path.join(tempDir, `dynamic_bg_${character}_${Date.now()}.wav`);
  
  // Enhanced ambient sound profiles with contextual atmosphere
  const ambientProfiles = {
    // Study/Focus environments
    'library-quiet': {
      name: 'Quiet Library',
      baseFreq: 200,
      baseVol: 0.012,
      ambientFreqs: [150, 300, 450],
      ambientVols: [0.008, 0.006, 0.004],
      description: 'Subtle paper rustling and quiet atmosphere'
    },
    'rain-gentle': {
      name: 'Gentle Rain',
      baseFreq: 180,
      baseVol: 0.015,
      ambientFreqs: [120, 240, 480, 960],
      ambientVols: [0.012, 0.010, 0.008, 0.004],
      description: 'Soft rainfall for deep concentration'
    },
    'cafe-ambient': {
      name: 'Coffee Shop',
      baseFreq: 220,
      baseVol: 0.018,
      ambientFreqs: [160, 320, 640],
      ambientVols: [0.010, 0.012, 0.006],
      description: 'Warm cafe atmosphere with subtle chatter'
    },
    
    // Nature environments
    'forest-birds': {
      name: 'Forest Sounds',
      baseFreq: 260,
      baseVol: 0.014,
      ambientFreqs: [880, 1320, 1760],
      ambientVols: [0.008, 0.006, 0.004],
      description: 'Birds chirping and rustling leaves'
    },
    'ocean-waves': {
      name: 'Ocean Waves',
      baseFreq: 140,
      baseVol: 0.020,
      ambientFreqs: [70, 210, 420],
      ambientVols: [0.015, 0.010, 0.008],
      description: 'Rhythmic waves and sea breeze'
    },
    
    // Professional environments
    'office-subtle': {
      name: 'Professional Office',
      baseFreq: 240,
      baseVol: 0.010,
      ambientFreqs: [180, 360, 540],
      ambientVols: [0.006, 0.008, 0.004],
      description: 'Subtle keyboard clicks and air conditioning'
    },
    'fireplace': {
      name: 'Cozy Fireplace',
      baseFreq: 160,
      baseVol: 0.016,
      ambientFreqs: [80, 320, 640],
      ambientVols: [0.012, 0.010, 0.006],
      description: 'Crackling fire for storytelling mode'
    },
    
    // Dynamic sound profiles by narration mode
    focus: {
      name: 'Focus Mode',
      baseFreq: 220,
      baseVol: 0.015,
      ambientFreqs: [440, 880],
      ambientVols: [0.008, 0.004],
      description: 'Calm, steady tones for concentration'
    },
    balanced: {
      name: 'Balanced Mode',
      baseFreq: 196,
      baseVol: 0.012,
      ambientFreqs: [392, 523],
      ambientVols: [0.010, 0.006],
      description: 'Natural, warm educational atmosphere'
    },
    engaging: {
      name: 'Engaging Mode',
      baseFreq: 440,
      baseVol: 0.020,
      ambientFreqs: [660, 880],
      ambientVols: [0.012, 0.008],
      description: 'Dynamic storytelling ambience'
    },
    doc_theatre: {
      name: 'Podcast Studio',
      baseFreq: 140,
      baseVol: 0.010,
      ambientFreqs: [270, 450, 680],
      ambientVols: [0.008, 0.006, 0.004],
      description: 'Professional studio atmosphere'
    }
  };
  
  // Select ambient profile (prioritize specific ambient type, fall back to narration mode)
  const profile = ambientProfiles[ambientType as keyof typeof ambientProfiles] || 
                  ambientProfiles[character as keyof typeof ambientProfiles] || 
                  ambientProfiles.balanced;
  
  console.log(`🎵 Generating background audio: ${profile.name} - ${profile.description}`);
  
  // Build FFmpeg command for layered ambient audio
  const inputs: string[] = [];
  const volumes: string[] = [];
  const mixInputs: string[] = [];
  
  // Base frequency
  inputs.push(`-f lavfi -i "sine=frequency=${profile.baseFreq}:duration=${durationSeconds}"`);
  volumes.push(`[${inputs.length - 1}:a]volume=${profile.baseVol}[base]`);
  mixInputs.push('[base]');
  
  // Ambient frequencies
  profile.ambientFreqs.forEach((freq, index) => {
    inputs.push(`-f lavfi -i "sine=frequency=${freq}:duration=${durationSeconds}"`);
    volumes.push(`[${inputs.length - 1}:a]volume=${profile.ambientVols[index]}[amb${index}]`);
    mixInputs.push(`[amb${index}]`);
  });
  
  // Add subtle modulation for realism
  if (ambientType !== 'none') {
    const modFreq = profile.baseFreq * 0.1;
    inputs.push(`-f lavfi -i "sine=frequency=${modFreq}:duration=${durationSeconds}"`);
    volumes.push(`[${inputs.length - 1}:a]volume=0.003[mod]`);
    mixInputs.push('[mod]');
  }
  
  const inputsStr = inputs.join(' ');
  const volumesStr = volumes.join(';');
  const mixStr = mixInputs.join('');
  const inputCount = inputs.length;
  
  const command = `ffmpeg ${inputsStr} -filter_complex "${volumesStr};${mixStr}amix=inputs=${inputCount}:duration=longest:dropout_transition=2[out]" -map "[out]" -y "${backgroundFile}"`;
  
  try {
    await execAsync(command);
    console.log(`✅ Generated ${profile.name} background audio`);
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

// Enhanced podcast script processing with natural conversation flow and SFX
async function enhancePodcastScript(script: string): Promise<string> {
  console.log('🎙️ Enhancing podcast script with natural conversation flow...');
  
  let processed = script;
  
  // Step 1: Add podcast intro and studio ambience
  processed = `[SFX: podcast_intro]
[BG: studio_ambience]

${processed}`;
  
  // Step 2: Enhance speaker transitions with natural SFX
  // Look for speaker patterns like "Host:", "Guest:", "Researcher:", etc.
  processed = processed.replace(/\n\n([A-Z][a-zA-Z\s]+:)/g, '\n\n[SFX: speaker_transition]\n$1');
  
  // Step 3: Handle interruptions and natural speech patterns
  // Convert em-dashes to interruption cues
  processed = processed.replace(/—([^—]+)—/g, ' [SFX: interruption] $1 [SFX: resume] ');
  processed = processed.replace(/—/g, ' [SFX: interruption] —');
  
  // Step 4: Handle overlapping speech markers
  processed = processed.replace(/\(overlapping\)/gi, '[SFX: voices_overlap]');
  processed = processed.replace(/\(overlap\)/gi, '[SFX: voices_overlap]');
  
  // Step 5: Add natural pauses and emphasis
  // Look for ellipses and add thoughtful pause cues
  processed = processed.replace(/\.{3}/g, ' [SFX: thoughtful_pause] ');
  
  // Step 6: Add emphasis for important points
  // Look for words in ALL CAPS and add emphasis cues
  processed = processed.replace(/\b[A-Z]{3,}\b/g, '[SFX: emphasis] $& [SFX: emphasis_end]');
  
  // Step 7: Add section transitions
  // Look for major topic shifts (double line breaks followed by new speakers)
  const paragraphs = processed.split('\n\n');
  if (paragraphs.length > 3) {
    // Add transition after first major section
    const midPoint = Math.floor(paragraphs.length / 2);
    paragraphs.splice(midPoint, 0, '[SFX: topic_transition]');
    processed = paragraphs.join('\n\n');
  }
  
  // Step 8: Add natural conversation fillers for realism
  // Randomly add subtle conversation markers (but sparingly)
  const conversationMarkers = [
    '[SFX: agreement_hum]',
    '[SFX: thoughtful_mm]',
    '[SFX: understanding_ah]'
  ];
  
  // Add markers to some speaker transitions (not all, to avoid overuse)
  const speakerTransitions = processed.match(/\[SFX: speaker_transition\]/g);
  if (speakerTransitions && speakerTransitions.length > 2) {
    // Add conversation markers to about 30% of transitions
    let transitionCount = 0;
    processed = processed.replace(/\[SFX: speaker_transition\]/g, (match) => {
      transitionCount++;
      if (transitionCount % 3 === 0) { // Every 3rd transition
        const marker = conversationMarkers[Math.floor(Math.random() * conversationMarkers.length)];
        return `${match}\n${marker}`;
      }
      return match;
    });
  }
  
  // Step 9: Add closing sequence
  processed = `${processed}\n\n[SFX: conversation_wind_down]\n[SFX: podcast_outro]\n[BG: fade_out]`;
  
  console.log('✅ Podcast script enhanced with natural conversation flow');
  return processed;
}

// Function to extract speakers from podcast script for multi-voice TTS
function extractSpeakers(script: string): { name: string, role: string }[] {
  const speakers: { name: string, role: string }[] = [];
  const speakerPattern = /^([A-Z][a-zA-Z\s]+):/gm;
  const matches = script.match(speakerPattern);
  
  if (matches) {
    const uniqueSpeakers = [...new Set(matches.map(m => m.replace(':', '').trim()))];
    uniqueSpeakers.forEach((speaker, index) => {
      let role = 'Guest';
      const lowerSpeaker = speaker.toLowerCase();
      
      if (lowerSpeaker.includes('host')) role = 'Host';
      else if (lowerSpeaker.includes('researcher')) role = 'Researcher';
      else if (lowerSpeaker.includes('analyst')) role = 'Analyst';
      else if (lowerSpeaker.includes('practitioner')) role = 'Practitioner';
      else if (lowerSpeaker.includes('expert')) role = 'Expert';
      else role = `Guest${index + 1}`;
      
      speakers.push({ name: speaker, role });
    });
  }
  
  return speakers;
}

const generateStoryRequestSchema = z.object({
  text: z.string().min(1),
  character: z.enum(["lumi", "spark", "bella"]),
  userId: z.string().optional()
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Comprehensive health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
          configured: false,
          connected: false,
          tables: {
            users: false,
            stories: false
          },
          using_fallback: false,
          error: null as string | null
        },
        api_keys: hasValidApiKeys(),
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version
        },
        migration_status: {
          required: false,
          instructions: '/DATABASE_SETUP.md'
        }
      };

      // Check database status
      try {
        // Test if Supabase is configured
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (supabaseUrl && supabaseKey && 
            !supabaseUrl.includes('your-project') && 
            !supabaseKey.includes('your-service-role-key')) {
          health.database.configured = true;
          
          // Test connection and tables
          try {
            const isValid = await db.validateDatabase();
            if (isValid) {
              health.database.connected = true;
              health.database.tables.users = true;
              health.database.tables.stories = true;
            } else {
              health.database.error = 'Tables missing or inaccessible';
              health.migration_status.required = true;
            }
          } catch (dbError) {
            health.database.error = dbError instanceof Error ? dbError.message : 'Connection failed';
            health.migration_status.required = true;
          }
        } else {
          health.database.using_fallback = true;
          health.database.error = 'Supabase credentials not configured';
        }
      } catch (error) {
        health.database.using_fallback = true;
        health.database.error = error instanceof Error ? error.message : 'Database check failed';
      }

      // Set appropriate status code based on database health
      let statusCode = 200;
      if (health.database.configured && !health.database.connected) {
        statusCode = 503; // Service unavailable
        health.status = 'degraded';
      } else if (health.database.using_fallback) {
        health.status = 'ok-fallback';
      }
      
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Health check failed'
      });
    }
  });

  // Simplified DB health check (legacy endpoint)
  app.get('/api/health/db', async (req, res) => {
    try {
      const demo = await db.getUser('health-check');
      const stories = await db.getUserStories('health-check', 1);
      res.json({ ok: true, hasUsersTable: demo !== undefined, hasStoriesTable: Array.isArray(stories) });
    } catch (e) {
      res.status(200).json({ ok: true, note: 'Using fallback storage; Supabase not reachable' });
    }
  });

  // Server-side OAuth code exchange endpoint
  app.get('/auth/callback-code', async (req: Request, res) => {
    try {
      const code = (req.query.code as string) || null;
  // Default redirect after successful sign-in
  let next = (req.query.next as string) || '/dashboard';
  // Only allow internal paths to avoid open redirects
  if (!next.startsWith('/')) next = '/dashboard';

      if (!code) return res.redirect('/auth/auth-code-error');

      // Create a server-side Supabase client using environment variables
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) {
        console.warn('Server OAuth: missing Supabase server credentials');
        return res.redirect('/auth/auth-code-error');
      }

      const serverClient = createServerSupabaseClient(supabaseUrl, supabaseKey);
      // Exchange the code for a session
      // @ts-ignore - exchangeCodeForSession exists on server client
      const { error } = await (serverClient.auth as any).exchangeCodeForSession(code);
      if (error) {
        console.warn('Server OAuth exchange failed:', error);
        return res.redirect('/auth/auth-code-error');
      }

      // Determine redirect host
      const forwardedHost = req.headers['x-forwarded-host'] as string | undefined;
      const origin = req.protocol + '://' + (forwardedHost || req.get('host'));
      return res.redirect(`${origin}${next}`);
    } catch (err) {
      console.error('Error in /auth/callback-code:', err);
      return res.redirect('/auth/auth-code-error');
    }
  });

  // Alias route: accept common OAuth redirect path and forward to the code-exchange handler
  app.get('/auth/callback', (req: Request, res) => {
    try {
      // Rebuild query string and forward to /auth/callback-code
      const params = new URLSearchParams();
      for (const key of Object.keys(req.query || {})) {
        const val = req.query[key as keyof typeof req.query];
        if (val !== undefined && val !== null) params.append(key, String(val));
      }
      const qs = params.toString();
      const forwardPath = `/auth/callback-code${qs ? '?' + qs : ''}`;
      return res.redirect(forwardPath);
    } catch (err) {
      console.error('Error in /auth/callback alias:', err);
      return res.redirect('/auth/auth-code-error');
    }
  });

  // Direct Supabase connectivity check (legacy endpoint)
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
  app.post("/api/story", optionalAuth, async (req, res) => {
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
        
        if (!isPremium && storiesCount >= 10) {
          return res.status(403).json({ 
            message: 'Free users are limited to 10 stories. Upgrade to premium for unlimited stories!',
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

      // Enhanced SFX and conversation flow processing for Podcast mode
      if (narrationMode === 'doc_theatre' && typeof generatedStory === 'string') {
        generatedStory = await enhancePodcastScript(generatedStory);
      }

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
  app.get("/api/stories", optionalAuth, async (req, res) => {
    console.log('� User:', req.user);
    
    if (!req.user) {
      console.log('❌ No authenticated user');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    console.log('📚 Fetching stories for user:', userId);

    try {
      // For demo users, include both demo and anonymous stories
      if (userId === 'demo@gmail.com') {
        console.log('🎭 Demo user detected, merging demo and anonymous stories');
        const demoStories = await db.getUserStories('demo@gmail.com', 50);
        const anonStories = await db.getUserStories('anonymous', 50);
        const combined = [...demoStories, ...anonStories]
          .sort((a, b) => new Date(b.created_at as any).getTime() - new Date(a.created_at as any).getTime())
          .slice(0, 10);
        console.log(`📖 Found ${combined.length} merged stories for demo user`);
        return res.json(combined);
      }

      const stories = await db.getUserStories(userId, 10);
      console.log(`📖 Found ${stories.length} stories for user:`, userId);
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
            
            // Save audio URL to database
            try {
              await db.updateStory(story.id, {
                audio_url: audioUrl,
                audio_provider: provider
              });
              console.log('✅ Audio URL saved to database');
            } catch (dbError) {
              console.error('⚠️ Failed to save audio URL to database:', dbError);
            }
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
          
          // Save audio URL to database
          try {
            await db.updateStory(story.id, {
              audio_url: audioUrl,
              audio_provider: provider
            });
            console.log('✅ Audio URL saved to database (OpenAI)');
          } catch (dbError) {
            console.error('⚠️ Failed to save audio URL to database:', dbError);
          }
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
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const start = Date.now();
    console.info({ requestId, route: '/api/demo-login', msg: 'demo login requested' });
    try {
      const demoEmail = 'demo@storymagic.ai';
      
      // First, check if demo user exists in our database
      let user = await db.getUserByEmail(demoEmail);
      console.debug({ requestId, step: 'lookup', demoEmail, found: !!user });
      
      if (!user) {
        console.info({ requestId, step: 'create', msg: 'Creating new demo user' });
        // Create demo user in our database
        user = await db.createUser({ 
          id: 'demo-' + Date.now(), // Generate a unique ID
          email: demoEmail,
          name: "Demo User",
          is_premium: false,
          stories_generated: 0,
          subscription_status: 'free',
          subscription_id: null,
          subscription_end_date: null,
          stripe_customer_id: null
        });
        
        if (!user) {
          throw new Error('Failed to create demo user in database');
        }
        console.info({ requestId, step: 'create', msg: 'Demo user created', userId: user.id });
      }

      // Generate session tokens (note: currently these are app-level demo tokens, not Supabase JWTs)
      const access_token = 'demo-' + Math.random().toString(36).substring(7);
      const refresh_token = 'demo-refresh-' + Math.random().toString(36).substring(7);

      const duration = Date.now() - start;
      console.info({ requestId, route: '/api/demo-login', msg: 'demo login completed', userId: user.id, duration });

      // Return user data with demo tokens
      res.json({
        ...user,
        access_token,
        refresh_token
      });
    } catch (error) {
      const duration = Date.now() - start;
      console.error({ requestId, route: '/api/demo-login', msg: 'demo login failed', error, duration });
      res.status(500).json({ message: 'Failed to create demo user' });
    }
  });

  // Create or get user (for auth)
  app.post("/api/user", async (req, res) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const start = Date.now();
    console.info({ requestId, route: '/api/user', msg: 'user create/get requested', body: { ...(req.body && { email: req.body.email }) } });
    try {
      const { email, name } = req.body;
      
      if (!email) {
        console.warn({ requestId, route: '/api/user', msg: 'missing email in request' });
        return res.status(400).json({ message: 'Email is required' });
      }

      // Check if user exists
      let user = await db.getUserByEmail(email);
      console.debug({ requestId, route: '/api/user', step: 'lookup', email, found: !!user });
      
      if (!user) {
        console.info({ requestId, route: '/api/user', step: 'create', msg: 'Creating new user', email });
        // Create new user
        user = await db.createUser({ 
          id: email,
          email, 
          name,
          is_premium: false,
          stories_generated: 0
        });
  console.info({ requestId, route: '/api/user', step: 'create', msg: 'User created', userId: user?.id });
      }

      const duration = Date.now() - start;
  console.info({ requestId, route: '/api/user', msg: 'user create/get completed', userId: user?.id, duration });
      res.json(user);
    } catch (error) {
      const duration = Date.now() - start;
      console.error({ requestId, route: '/api/user', msg: 'user create/get failed', error, duration });
      res.status(500).json({ message: 'Failed to create/get user' });
    }
  });

  // Simple upgrade endpoint for MVP: marks user as premium
  app.post('/api/upgrade', optionalAuth, async (req, res) => {
    try {
      const headerUserId = req.headers['x-user-id'] as string | undefined;
      const authUserId = req.user?.id as string | undefined;
      const userId = authUserId || headerUserId || 'demo@gmail.com';
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const user = await db.getUser(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      await db.updateUser(userId, { is_premium: true, subscription_status: 'active' });
      res.json({ ok: true });
    } catch (e) {
      console.error('Upgrade failed', e);
      res.status(500).json({ message: 'Upgrade failed' });
    }
  });

  // Lemon Squeezy payment endpoints
  app.post('/api/payment/lemonsqueezy/create-checkout', optionalAuth, async (req, res) => {
    try {
      const { email, userId } = req.body;
      const authUserId = req.user?.id || req.headers['x-user-id'] as string;
      const effectiveUserId = userId || authUserId;
      
      if (!email || !effectiveUserId) {
        return res.status(400).json({ message: 'Email and userId are required' });
      }

      // Get user to determine if they can upgrade
      const user = await db.getUser(effectiveUserId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.is_premium) {
        return res.status(400).json({ message: 'User is already premium' });
      }

      // Create Lemon Squeezy checkout session
      const checkout = await lemonSqueezyService.createCheckout({
        email,
        name: user.name || undefined,
        userId: effectiveUserId,
        customFields: {
          plan_type: 'premium_monthly'
        }
      });

      res.json({
        checkout_url: checkout.checkoutUrl,
        checkout_id: checkout.checkoutId
      });
    } catch (error) {
      console.error('Lemon Squeezy checkout creation failed:', error);
      res.status(500).json({ message: 'Failed to create checkout session' });
    }
  });

  // Lemon Squeezy webhook endpoint
  app.post('/api/payment/lemonsqueezy/webhook', async (req, res) => {
    try {
      const signature = req.headers['x-signature'] as string;
      const payload = JSON.stringify(req.body);

      // Verify webhook signature
      if (!lemonSqueezyService.verifyWebhookSignature(payload, signature)) {
        console.error('Invalid Lemon Squeezy webhook signature');
        return res.status(400).json({ message: 'Invalid signature' });
      }

      const event = req.body;
      console.log('Lemon Squeezy webhook received:', event.meta.event_name);

      switch (event.meta.event_name) {
        case 'order_created':
          // Handle successful payment
          await handleOrderCreated(event.data);
          break;
          
        case 'subscription_created':
          // Handle subscription creation
          await handleSubscriptionCreated(event.data);
          break;
          
        case 'subscription_updated':
          // Handle subscription updates (renewal, cancellation, etc.)
          await handleSubscriptionUpdated(event.data);
          break;
          
        case 'subscription_cancelled':
          // Handle subscription cancellation
          await handleSubscriptionCancelled(event.data);
          break;
          
        default:
          console.log('Unhandled Lemon Squeezy webhook event:', event.meta.event_name);
      }

      res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
      console.error('Lemon Squeezy webhook processing failed:', error);
      res.status(500).json({ message: 'Webhook processing failed' });
    }
  });

  // Helper functions for webhook processing
  async function handleOrderCreated(orderData: any) {
    try {
      const userId = orderData.attributes.custom?.user_id;
      if (!userId) {
        console.error('No user_id in order custom data');
        return;
      }

      // Update user to premium
      await db.updateUser(userId, {
        is_premium: true,
        subscription_status: 'active',
        lemonsqueezy_customer_id: orderData.attributes.customer_id?.toString() || null
      });

      console.log('User upgraded to premium:', userId);
    } catch (error) {
      console.error('Error handling order created:', error);
    }
  }

  async function handleSubscriptionCreated(subscriptionData: any) {
    try {
      const userId = subscriptionData.attributes.custom?.user_id;
      if (!userId) {
        console.error('No user_id in subscription custom data');
        return;
      }

      // Create subscription record
      const subscriptionRecord = {
        user_id: userId,
        lemonsqueezy_subscription_id: subscriptionData.id,
        lemonsqueezy_order_id: subscriptionData.attributes.order_id?.toString(),
        lemonsqueezy_product_id: subscriptionData.attributes.product_id?.toString(),
        lemonsqueezy_variant_id: subscriptionData.attributes.variant_id?.toString(),
        status: subscriptionData.attributes.status,
        plan_type: 'premium_monthly',
        current_period_start: new Date(subscriptionData.attributes.created_at),
        current_period_end: new Date(subscriptionData.attributes.renews_at),
        amount: Math.round(subscriptionData.attributes.total_usd * 100), // Convert to cents
        currency: 'USD'
      };

      await db.createSubscription(subscriptionRecord);

      // Update user subscription info
      await db.updateUser(userId, {
        lemonsqueezy_subscription_id: subscriptionData.id,
        subscription_end_date: subscriptionData.attributes.renews_at ? new Date(subscriptionData.attributes.renews_at).toISOString() : null
      });

      console.log('Subscription created for user:', userId);
    } catch (error) {
      console.error('Error handling subscription created:', error);
    }
  }

  async function handleSubscriptionUpdated(subscriptionData: any) {
    try {
      const subscriptionId = subscriptionData.id;
      const status = subscriptionData.attributes.status;
      const renewsAt = subscriptionData.attributes.renews_at;
      const endsAt = subscriptionData.attributes.ends_at;

      // Find user by subscription ID
      const user = await db.getUserByLemonSqueezySubscription(subscriptionId);
      if (!user) {
        console.error('User not found for subscription:', subscriptionId);
        return;
      }

      // Update subscription status
      const isActive = ['active', 'on_trial'].includes(status);
      await db.updateUser(user.id, {
        is_premium: isActive,
        subscription_status: isActive ? 'active' : status,
        subscription_end_date: endsAt ? new Date(endsAt).toISOString() : (renewsAt ? new Date(renewsAt).toISOString() : null)
      });

      console.log('Subscription updated for user:', user.id, 'Status:', status);
    } catch (error) {
      console.error('Error handling subscription updated:', error);
    }
  }

  async function handleSubscriptionCancelled(subscriptionData: any) {
    try {
      const subscriptionId = subscriptionData.id;
      
      // Find user by subscription ID
      const user = await db.getUserByLemonSqueezySubscription(subscriptionId);
      if (!user) {
        console.error('User not found for subscription:', subscriptionId);
        return;
      }

      // Update user to non-premium (but keep access until end date)
      const endsAt = subscriptionData.attributes.ends_at;
      await db.updateUser(user.id, {
        subscription_status: 'cancelled',
        subscription_end_date: endsAt ? new Date(endsAt).toISOString() : null
      });

      // If the subscription has already ended, remove premium access
      if (endsAt && new Date(endsAt) <= new Date()) {
        await db.updateUser(user.id, {
          is_premium: false
        });
      }

      console.log('Subscription cancelled for user:', user.id);
    } catch (error) {
      console.error('Error handling subscription cancelled:', error);
    }
  }

  // Get subscription status
  app.get('/api/subscription/status', optionalAuth, async (req, res) => {
    try {
      const userId = req.user?.id || req.headers['x-user-id'] as string;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      
      const user = await db.getUser(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      
      res.json({
        is_premium: user.is_premium,
        subscription_status: user.subscription_status,
        subscription_end_date: user.subscription_end_date
      });
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      res.status(500).json({ message: 'Failed to get subscription status' });
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
          if (stories.length >= 10) {
            return res.status(403).json({
              message: 'Free users are limited to 10 stories. Upgrade to premium for unlimited stories!',
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
          if (stories.length >= 10) {
            return res.status(403).json({
              message: 'Free users are limited to 10 stories. Upgrade to premium for unlimited stories!',
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

  return httpServer;
}
