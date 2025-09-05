import { db } from '@/lib/db';
import { users, stories } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { DemoDatabase } from './demo-database';

// Check if we should use demo database
let useDemoDatabase = false;

// Test database connection on startup
(async () => {
  try {
    await db.select().from(users).limit(1);
    console.log('Real database connection successful');
  } catch (error) {
    console.warn('Real database unavailable, using demo database:', error);
    useDemoDatabase = true;
  }
})();

export class DatabaseService {
  static async validateDatabase(): Promise<boolean> {
    if (useDemoDatabase) {
      return DemoDatabase.validateDatabase();
    }
    try {
      console.log('Validating database connection...');
      // Simple selects to ensure tables exist
      await db.select().from(users).limit(1);
      await db.select().from(stories).limit(1);
      console.log('Database validation successful');
      return true;
    } catch (error) {
      console.error('Database validation failed, switching to demo mode:', error);
      useDemoDatabase = true;
      return DemoDatabase.validateDatabase();
    }
  }

  static async getUser(userId: string) {
    if (useDemoDatabase) {
      return DemoDatabase.getUser(userId);
    }
    try {
      const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      return rows[0] || null;
    } catch (error) {
      console.error('Error fetching user, switching to demo mode:', error);
      useDemoDatabase = true;
      return DemoDatabase.getUser(userId);
    }
  }

  static async getUserByEmail(email: string) {
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return rows[0] || null;
  }

  static async getUserStories(userId: string, limit: number = 50) {
    if (useDemoDatabase) {
      return DemoDatabase.getUserStories(userId, limit);
    }
    try {
      const rows = await db
        .select()
        .from(stories)
        .where(eq(stories.user_id, userId))
        .orderBy(desc(stories.created_at))
        .limit(limit);
      return rows;
    } catch (error) {
      console.error('Error fetching user stories, switching to demo mode:', error);
      useDemoDatabase = true;
      return DemoDatabase.getUserStories(userId, limit);
    }
  }

  static async createStory(input: {
    user_id: string;
    input_text: string;
    output_story: string | null;
    narration_mode: string;
    source: 'api' | 'pdf';
  }) {
    if (useDemoDatabase) {
      return DemoDatabase.createStory(input);
    }
    try {
      // Ensure output_story is not null for database insertion
      const storyData = {
        ...input,
        output_story: input.output_story || 'Story generation failed'
      };
      const [row] = await db.insert(stories).values(storyData).returning();
      return row || null;
    } catch (error) {
      console.error('Error creating story, switching to demo mode:', error);
      useDemoDatabase = true;
      return DemoDatabase.createStory(input);
    }
  }

  static async createUser(input: {
    id: string;
    email: string;
    name: string;
    is_premium: boolean;
    stories_generated: number;
  }) {
    if (useDemoDatabase) {
      return DemoDatabase.createUser(input);
    }
    try {
      const [row] = await db.insert(users).values(input).returning();
      return row || null;
    } catch (error) {
      console.error('Error creating user, switching to demo mode:', error);
      useDemoDatabase = true;
      return DemoDatabase.createUser(input);
    }
  }

  static async updateUser(userId: string, updates: Partial<typeof users.$inferSelect>) {
    if (useDemoDatabase) {
      return DemoDatabase.updateUser(userId, updates);
    }
    try {
      const [row] = await db.update(users).set(updates).where(eq(users.id, userId)).returning();
      return row || null;
    } catch (error) {
      console.error('Error updating user, switching to demo mode:', error);
      useDemoDatabase = true;
      return DemoDatabase.updateUser(userId, updates);
    }
  }
}


