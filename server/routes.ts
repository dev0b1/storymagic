import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStorySchema } from "@shared/schema";
import { z } from "zod";

const generateStoryRequestSchema = z.object({
  text: z.string().min(1),
  character: z.enum(["lumi", "spark", "bella"]),
  userId: z.string().optional()
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate story endpoint
  app.post("/api/story", async (req, res) => {
    try {
      const { text, character, userId } = generateStoryRequestSchema.parse(req.body);
      
      // Character personas for AI prompt
      const characterPersonas = {
        lumi: "You are Lumi the Owl, a wise and calm storyteller. You speak with gentle wisdom and use nature metaphors. Your stories are thoughtful and educational, but always magical and enchanting.",
        spark: "You are Sir Spark the Fox, a cheeky and energetic storyteller. You're playful, use humor, and tell fast-paced adventures with lots of action and surprises.",
        bella: "You are Bella the Bot, a curious and cheerful storyteller. You're enthusiastic about discovery, ask wonder-filled questions, and explain things with joy and excitement."
      };

      // Create system prompt with character persona
      const systemPrompt = `${characterPersonas[character]} Rewrite the following content as a magical children's story (3-5 paragraphs). Make it whimsical, engaging, and appropriate for children aged 5-12. Include magical elements and maintain your character's unique voice and personality.`;

      // Call OpenRouter API
      const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY || 'sk-or-v1-default'}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000',
          'X-Title': 'StoryMagic AI'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-haiku',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ],
          max_tokens: 1000,
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

      // Save story if user is logged in
      let savedStory = null;
      if (userId) {
        savedStory = await storage.createStory({
          userId,
          inputText: text,
          outputStory: generatedStory,
          character
        });
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
        user = await storage.createUser({ email, name });
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
