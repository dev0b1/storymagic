import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStorySchema } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";

// Configure OpenAI for TTS
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY,
  baseURL: process.env.OPENAI_API_KEY ? undefined : "https://openrouter.ai/api/v1"
});

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

      // Call OpenRouter API
      const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || 'sk-or-v1-default'}`,
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

      if (!openRouterResponse.ok) {
        throw new Error(`OpenRouter API error: ${openRouterResponse.status}`);
      }

      const openRouterData = await openRouterResponse.json();
      const generatedStory = openRouterData.choices?.[0]?.message?.content;

      if (!generatedStory) {
        throw new Error('No story generated from API');
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
        savedStory
      });

    } catch (error) {
      console.error('Story generation error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to generate story' 
      });
    }
  });

  // Get user info
  app.get("/api/me", async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
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

  // Generate audio for story
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

      // Character voice settings
      const voiceSettings = {
        lumi: { voice: "alloy", speed: 0.9 },
        spark: { voice: "echo", speed: 1.1 },
        bella: { voice: "nova", speed: 1.0 }
      };

      const settings = voiceSettings[story.character as keyof typeof voiceSettings] || voiceSettings.lumi;

      // Generate TTS using OpenAI (if we have OpenAI key, otherwise return placeholder)
      let audioUrl = null;
      if (process.env.OPENAI_API_KEY) {
        try {
          const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: settings.voice as any,
            input: story.outputStory,
            speed: settings.speed,
          });

          const buffer = Buffer.from(await mp3.arrayBuffer());
          const audioId = `audio_${Date.now()}_${story.id}`;
          
          // In a real app, you'd upload to cloud storage
          // For now, we'll create a data URL
          audioUrl = `data:audio/mp3;base64,${buffer.toString('base64')}`;
          
        } catch (error) {
          console.error('TTS generation error:', error);
          // Return success but no audio if TTS fails
        }
      }

      res.json({ 
        audioUrl,
        message: audioUrl ? 'Audio generated successfully' : 'Audio generation not available'
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
