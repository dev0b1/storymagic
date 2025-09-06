import { db } from '@/lib/db';
import { users, stories } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

export class DatabaseService {
  static async validateDatabase(): Promise<boolean> {
    try {
      console.log('Validating database connection...');
      // Simple selects to ensure tables exist
      await db.select().from(users).limit(1);
      await db.select().from(stories).limit(1);
      console.log('Database validation successful');
      return true;
    } catch (error) {
      console.error('Database validation failed:', error);
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getUser(userId: string) {
    try {
      const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      return rows[0] || null;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error(`Failed to fetch user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getUserByEmail(email: string) {
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return rows[0] || null;
  }

  static async getUserStories(userId: string, limit: number = 50) {
    try {
      const rows = await db
        .select()
        .from(stories)
        .where(eq(stories.user_id, userId))
        .orderBy(desc(stories.created_at))
        .limit(limit);
      return rows;
    } catch (error) {
      console.error('Error fetching user stories:', error);
      throw new Error(`Failed to fetch user stories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async createStory(input: {
    user_id: string;
    input_text: string;
    output_story: string | null;
    narration_mode: string;
    source: 'api' | 'pdf';
  }) {
    try {
      // Ensure output_story is not null for database insertion
      const storyData = {
        ...input,
        output_story: input.output_story || 'Story generation failed'
      };
      const [row] = await db.insert(stories).values(storyData).returning();
      return row || null;
    } catch (error) {
      console.error('Error creating story:', error);
      throw new Error(`Failed to create story: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async createUser(input: {
    id: string;
    email: string;
    name: string;
    is_premium: boolean;
    stories_generated: number;
  }) {
    try {
      const [row] = await db.insert(users).values(input).returning();
      return row || null;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateUser(userId: string, updates: Partial<typeof users.$inferSelect>) {
    try {
      const [row] = await db.update(users).set(updates).where(eq(users.id, userId)).returning();
      return row || null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}


