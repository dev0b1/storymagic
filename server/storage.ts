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
      ...insertUser,
      name: insertUser.name || null,
      isPremium: insertUser.isPremium || "false",
      storiesGenerated: insertUser.storiesGenerated || "0",
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Create user with specific ID for demo purposes
  async createUserWithId(userId: string, insertUser: InsertUser): Promise<User> {
    const user: User = { 
      ...insertUser,
      name: insertUser.name || null,
      isPremium: insertUser.isPremium || "false",
      storiesGenerated: insertUser.storiesGenerated || "0",
      id: userId,
      createdAt: new Date()
    };
    this.users.set(userId, user);
    return user;
  }

  async getUserStories(userId: string, limit = 10): Promise<Story[]> {
    const userStories = Array.from(this.stories.values())
      .filter(story => story.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
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
      ...insertStory,
      audioUrl: insertStory.audioUrl || null,
      id,
      createdAt: new Date()
    };
    this.stories.set(id, story);
    return story;
  }
}

export const storage = new MemStorage();
