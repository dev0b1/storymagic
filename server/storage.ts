import { type User, type InsertUser, type Story, type InsertStory } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createUserWithId(userId: string, user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  getUserStories(userId: string, limit?: number): Promise<Story[]>;
  createStory(story: InsertStory): Promise<Story>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private stories: Map<string, Story>;

  constructor() {
    this.users = new Map();
    this.stories = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
  id,
  email: insertUser.email,
  name: insertUser.name ?? null,
  is_premium: insertUser.is_premium ?? false,
  stories_generated: insertUser.stories_generated ?? 0,
  subscription_status: insertUser.subscription_status ?? 'free',
  subscription_id: insertUser.subscription_id ?? null,
  subscription_end_date: insertUser.subscription_end_date ?? null,
  lemonsqueezy_customer_id: insertUser.lemonsqueezy_customer_id ?? null,
  lemonsqueezy_subscription_id: insertUser.lemonsqueezy_subscription_id ?? null,
  created_at: new Date(),
  updated_at: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Create user with specific ID for demo purposes
  async createUserWithId(userId: string, insertUser: InsertUser): Promise<User> {
    const user: User = { 
  id: userId,
  email: insertUser.email,
  name: insertUser.name ?? null,
  is_premium: insertUser.is_premium ?? false,
  stories_generated: insertUser.stories_generated ?? 0,
  subscription_status: insertUser.subscription_status ?? 'free',
  subscription_id: insertUser.subscription_id ?? null,
  subscription_end_date: insertUser.subscription_end_date ?? null,
  lemonsqueezy_customer_id: insertUser.lemonsqueezy_customer_id ?? null,
  lemonsqueezy_subscription_id: insertUser.lemonsqueezy_subscription_id ?? null,
  created_at: new Date(),
  updated_at: new Date()
    };
    this.users.set(userId, user);
    return user;
  }

  async getUserStories(userId: string, limit = 10): Promise<Story[]> {
    const userStories = Array.from(this.stories.values())
  .filter(story => story.user_id === userId)
  .sort((a, b) => (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0))
      .slice(0, limit);
    return userStories;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      throw new Error('User not found');
    }
    const updatedUser = { ...existingUser, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const id = randomUUID();
    const story: Story = {
  id,
  user_id: insertStory.user_id,
  input_text: insertStory.input_text,
  output_story: insertStory.output_story,
  narration_mode: insertStory.narration_mode ?? 'balanced',
  content_type: insertStory.content_type ?? 'general',
  source: insertStory.source ?? 'text',
  story_id: insertStory.story_id ?? null,
  used_fallback: insertStory.used_fallback ?? false,
  created_at: new Date(),
  updated_at: new Date()
    };
    this.stories.set(id, story);
    return story;
  }
}

export const storage = new MemStorage();
