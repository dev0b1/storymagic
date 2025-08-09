import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStorySchema } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

// Fallback story generation function
function generateFallbackStory(inputText: string, character: string): string {
  const storyTemplates = {
    lumi: [
      "Once upon a time, in a mystical forest where ancient trees whispered secrets to the wind, there lived a wise owl named Lumi. One day, Lumi discovered something remarkable related to {input}. Through patient observation and careful thought, Lumi learned an important lesson about wisdom and understanding. The forest creatures gathered around as Lumi shared this newfound knowledge, and they all lived more harmoniously ever after.",
      "In the quiet hours before dawn, when the world was painted in shades of silver and blue, Lumi the Owl noticed something special about {input}. With her keen eyes and thoughtful nature, she explored this discovery, learning valuable lessons about patience and wisdom along the way. The other woodland creatures were amazed by her insights, and together they created a more peaceful and understanding community."
    ],
    spark: [
      "Brave Sir Spark the Fox, with coat so bright and bold, discovered something grand about {input}, a tale that must be told! He leaped and bounded through the glade, his spirit fierce and free, learning lessons of courage and friendship, as happy as can be! The forest rang with joyful songs, as all the creatures cheered, for Spark had shown them something new, that filled their hearts with cheer!",
      "In a land of rolling hills and streams that sparkle in the sun, lived Spark the Fox so brave and true, whose adventures had begun! He found something amazing about {input}, and with courage in his heart, he shared his discoveries with friends, each playing their own part! Together they learned and grew each day, their friendship strong and bright, creating magic everywhere they went, from morning until night!"
    ],
    bella: [
      "Beep boop! Hello there, friends! I'm Bella the Bot, and I've got the WILDEST story about {input}! *giggles in binary* So picture this - imagine if {input} could talk, dance, and maybe even do the robot like me! I processed this information through my super-cool circuits and discovered something absolutely amazing! My LED lights are flashing with excitement because this adventure taught me that even robots can learn about friendship, creativity, and having fun! Error 404: Boring story not found!",
      "Whirrrr, click, beep! Bella the Bot here with a totally bonkers tale about {input}! My processors are buzzing because I just computed the most incredible adventure! Imagine if {input} had special powers and could transform into anything imaginable! Through my digital dreams and electronic excitement, I learned that being different is actually super cool! My circuits are sparking with joy because this story proves that technology and imagination make the perfect team! System message: Fun levels at maximum capacity!"
    ]
  };

  const templates = storyTemplates[character as keyof typeof storyTemplates] || storyTemplates.lumi;
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  
  // Replace {input} placeholder with actual input text
  let story = randomTemplate.replace(/{input}/g, inputText);
  
  // Add a note about using fallback
  story += "\n\n✨ This magical story was created using our backup storytelling system to ensure you always get a wonderful tale, even when our main AI is taking a little break!";
  
  return story;
}

const execAsync = promisify(exec);

// Create background music using ffmpeg and audio synthesis
async function createBackgroundMusic(durationSeconds: number): Promise<string> {
  const tempDir = path.join(process.cwd(), 'tmp');
  await fs.mkdir(tempDir, { recursive: true });
  
  const backgroundFile = path.join(tempDir, `bg_${Date.now()}.wav`);
  
  // Create a gentle, magical background tone using ffmpeg's audio synthesis
  const command = `ffmpeg -f lavfi -i "sine=frequency=220:duration=${durationSeconds}" -f lavfi -i "sine=frequency=330:duration=${durationSeconds}" -f lavfi -i "sine=frequency=440:duration=${durationSeconds}" -filter_complex "[0:a]volume=0.02[a1];[1:a]volume=0.015[a2];[2:a]volume=0.01[a3];[a1][a2][a3]amix=inputs=3:duration=longest:dropout_transition=2[out]" -map "[out]" -y "${backgroundFile}"`;
  
  try {
    await execAsync(command);
    return backgroundFile;
  } catch (error) {
    console.log('Background music generation failed, continuing without it:', error);
    return '';
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
  // Generate story endpoint with limits
  app.post("/api/story", async (req, res) => {
    try {
      const { text, character, userId } = generateStoryRequestSchema.parse(req.body);
      
      // Get user to check limits
      const user = userId ? await storage.getUser(userId) : null;
      const isPremium = user?.isPremium === "true";
      
      // Text length limits
      const maxLength = isPremium ? 20000 : 600; // Pro: 20k characters, Free: 600 characters
      if (text.length > maxLength) {
        return res.status(400).json({ 
          message: `Text too long. ${isPremium ? 'Premium' : 'Free'} users are limited to ${maxLength} characters. Your text is ${text.length} characters.` 
        });
      }
      
      // Check story limits for non-premium users
      if (userId && user) {
        const storiesCount = parseInt(user.storiesGenerated || "0");
        
        if (!isPremium && storiesCount >= 2) {
          return res.status(403).json({ 
            message: 'Free users are limited to 2 stories. Upgrade to premium for unlimited stories!',
            code: 'LIMIT_REACHED'
          });
        }
      }
      
      // Enhanced character personalities with context-aware prompts
      const characterPersonas = {
        lumi: "You are Lumi the Owl, a calm, wise, and educational storyteller who explains deep ideas clearly.",
        spark: "You are Sir Spark the Fox, a bold and poetic storyteller who speaks in rhyme and loves action.",
        bella: "You are Bella the Bot, a fast, funny, cheeky storyteller who loves wild imagination."
      };

      // Create enhanced system prompt with character persona
      const systemPrompt = `${characterPersonas[character]}
Take the following user text and turn it into a short magical story with a magical style.
Make the story engaging and optionally include a subtle life lesson.
Keep the story under 400 words.`;

      let generatedStory = null;
      let usedFallback = false;

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
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `User input: "${text}"` }
            ],
            max_tokens: 600,
            temperature: 0.8
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
        console.error('OpenRouter API failed:', openRouterError);
        
        // Fallback: Generate story using template system
        usedFallback = true;
        generatedStory = generateFallbackStory(text, character);
      }

      // Save story and update count if user is logged in
      let savedStory = null;
      if (userId) {
        savedStory = await storage.createStory({
          userId,
          inputText: text,
          outputStory: generatedStory,
          character
        });
        
        // Update user's story count
        const user = await storage.getUser(userId);
        if (user) {
          const newCount = parseInt(user.storiesGenerated || "0") + 1;
          await storage.updateUser(userId, { storiesGenerated: newCount.toString() });
        }
      }

      res.json({
        story: generatedStory,
        character,
        storyId: savedStory?.id,
        savedStory,
        usedFallback: usedFallback
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
      let user = await storage.getUser(userId);
      
      // If user doesn't exist, create them (for demo purposes)
      if (!user) {
        const email = userId.includes('@') ? userId : `${userId}@demo.com`;
        user = await storage.createUserWithId(userId, {
          email: email,
          name: email.split('@')[0],
          isPremium: "false",
          storiesGenerated: "0"
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to get user info' });
    }
  });

  // Get user stories
  app.get("/api/stories", async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const stories = await storage.getUserStories(userId, 3);
      res.json(stories);
    } catch (error) {
      console.error('Get stories error:', error);
      res.status(500).json({ message: 'Failed to get stories' });
    }
  });

  // Generate audio for story with multiple TTS providers
  app.post("/api/story/:id/audio", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Get story and verify ownership
      const stories = await storage.getUserStories(userId);
      const story = stories.find(s => s.id === id);
      
      if (!story) {
        return res.status(404).json({ message: 'Story not found' });
      }

      // Get user to check if premium (for demo purposes, allow audio for all users)
      const user = await storage.getUser(userId);
      const allowAudio = true; // Allow audio generation for all users including demo

      let audioUrl = null;
      let provider = 'none';

      // Try ElevenLabs first (premium quality)
      if (process.env.ELEVENLABS_API_KEY) {
        try {
          const elevenLabsVoices = {
            lumi: 'pNInz6obpgDQGcFmaJgB', // Alice - calm, clear
            spark: '21m00Tcm4TlvDq8ikWAM', // Rachel - energetic
            bella: 'AZnzlk1XvdvUeBnXmlld' // Domi - playful
          };

          const voiceId = elevenLabsVoices[story.character as keyof typeof elevenLabsVoices] || elevenLabsVoices.lumi;
          
          const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
              'Accept': 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': process.env.ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
              text: story.outputStory,
              model_id: 'eleven_monolingual_v1',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5,
                style: 0.0,
                use_speaker_boost: true
              }
            })
          });

          if (elevenLabsResponse.ok) {
            const audioBuffer = await elevenLabsResponse.arrayBuffer();
            
            // Save TTS audio to temp file for mixing
            const tempDir = path.join(process.cwd(), 'tmp');
            await fs.mkdir(tempDir, { recursive: true });
            const ttsFile = path.join(tempDir, `tts_${Date.now()}.mp3`);
            await fs.writeFile(ttsFile, Buffer.from(audioBuffer));

            // Estimate duration and create background music
            const wordCount = story.outputStory.split(' ').length;
            const estimatedDuration = Math.ceil(wordCount / 150 * 60);
            const backgroundFile = await createBackgroundMusic(estimatedDuration);
            
            // Mix with background music
            const finalFile = await mixAudioWithBackground(ttsFile, backgroundFile);
            const finalBuffer = await fs.readFile(finalFile);
            
            // Clean up temp files
            try {
              await fs.unlink(ttsFile);
              if (finalFile !== ttsFile) await fs.unlink(finalFile);
            } catch (e) {}
            
            audioUrl = `data:audio/mpeg;base64,${finalBuffer.toString('base64')}`;
            provider = 'elevenlabs';
          }
        } catch (error) {
          console.error('ElevenLabs TTS error:', error);
        }
      }

      // Fallback to OpenAI TTS
      if (!audioUrl && process.env.OPENAI_API_KEY) {
        try {
          const voiceSettings = {
            lumi: { voice: "alloy", speed: 0.9 },
            spark: { voice: "echo", speed: 1.1 },
            bella: { voice: "nova", speed: 1.0 }
          };
          
          const settings = voiceSettings[story.character as keyof typeof voiceSettings] || voiceSettings.lumi;
          const openaiClient = getOpenAIClient();
          
          const mp3 = await openaiClient.audio.speech.create({
            model: "tts-1",
            voice: settings.voice as any,
            input: story.outputStory,
            speed: settings.speed,
          });

          const buffer = Buffer.from(await mp3.arrayBuffer());
          
          // Save TTS audio to temp file for mixing
          const tempDir = path.join(process.cwd(), 'tmp');
          await fs.mkdir(tempDir, { recursive: true });
          const ttsFile = path.join(tempDir, `tts_${Date.now()}.mp3`);
          await fs.writeFile(ttsFile, buffer);

          // Estimate duration and create background music
          const wordCount = story.outputStory.split(' ').length;
          const estimatedDuration = Math.ceil(wordCount / 150 * 60);
          const backgroundFile = await createBackgroundMusic(estimatedDuration);
          
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
      let user = await storage.getUserByEmail(demoEmail);
      
      if (!user) {
        // Create demo user
        user = await storage.createUser({ 
          email: demoEmail, 
          name: "Demo User",
          isPremium: "false",
          storiesGenerated: "0"
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
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({ 
          email, 
          name,
          isPremium: "false",
          storiesGenerated: "0"
        });
      }

      res.json(user);
    } catch (error) {
      console.error('User creation error:', error);
      res.status(500).json({ message: 'Failed to create/get user' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
