import { db } from '@/lib/db';
import { user_profiles, documents, flashcards, study_sessions } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';

export class DatabaseService {
  static async validateDatabase(): Promise<boolean> {
    try {
      console.log('Validating database connection...');
      // Simple selects to ensure tables exist
      await db.select().from(user_profiles).limit(1);
      await db.select().from(documents).limit(1);
      await db.select().from(flashcards).limit(1);
      console.log('Database validation successful');
      return true;
    } catch (error) {
      console.error('Database validation failed:', error);
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getUserProfile(userId: string) {
    try {
      const rows = await db.select().from(user_profiles).where(eq(user_profiles.id, userId)).limit(1);
      return rows[0] || null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error(`Failed to fetch user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getUserProfileByEmail(email: string) {
    const rows = await db.select().from(user_profiles).where(eq(user_profiles.email, email)).limit(1);
    return rows[0] || null;
  }

  static async getUserDocuments(userId: string, limit: number = 50) {
    try {
      const rows = await db
        .select()
        .from(documents)
        .where(eq(documents.user_id, userId))
        .orderBy(desc(documents.created_at))
        .limit(limit);
      return rows;
    } catch (error) {
      console.error('Error fetching user documents:', error);
      throw new Error(`Failed to fetch user documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getUserFlashcards(userId: string, limit: number = 100) {
    try {
      const rows = await db
        .select()
        .from(flashcards)
        .where(eq(flashcards.user_id, userId))
        .orderBy(desc(flashcards.created_at))
        .limit(limit);
      return rows;
    } catch (error) {
      console.error('Error fetching user flashcards:', error);
      throw new Error(`Failed to fetch user flashcards: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getFlashcardsByDocument(documentId: string, userId: string) {
    try {
      const rows = await db
        .select()
        .from(flashcards)
        .where(and(eq(flashcards.document_id, documentId), eq(flashcards.user_id, userId)))
        .orderBy(desc(flashcards.created_at));
      return rows;
    } catch (error) {
      console.error('Error fetching flashcards by document:', error);
      throw new Error(`Failed to fetch flashcards: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async createDocument(input: {
    user_id: string;
    title: string;
    file_name: string;
    file_url: string;
    file_size?: number;
    content_type?: string;
    extracted_text?: string;
    summary?: string;
    processing_status?: string;
  }) {
    try {
      const [row] = await db.insert(documents).values(input).returning();
      return row || null;
    } catch (error) {
      console.error('Error creating document:', error);
      throw new Error(`Failed to create document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateDocument(documentId: string, updates: Partial<typeof documents.$inferSelect>) {
    try {
      const [row] = await db.update(documents).set(updates).where(eq(documents.id, documentId)).returning();
      return row || null;
    } catch (error) {
      console.error('Error updating document:', error);
      throw new Error(`Failed to update document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async createFlashcard(input: {
    document_id: string;
    user_id: string;
    front: string;
    back: string;
    hint?: string;
    difficulty?: string;
    category?: string;
  }) {
    try {
      const [row] = await db.insert(flashcards).values(input).returning();
      return row || null;
    } catch (error) {
      console.error('Error creating flashcard:', error);
      throw new Error(`Failed to create flashcard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async createStudySession(input: {
    user_id: string;
    document_id?: string;
    session_type?: string;
    cards_studied?: number;
    correct_answers?: number;
    session_duration?: number;
  }) {
    try {
      const [row] = await db.insert(study_sessions).values(input).returning();
      return row || null;
    } catch (error) {
      console.error('Error creating study session:', error);
      throw new Error(`Failed to create study session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async createUserProfile(input: {
    id: string;
    email: string;
    name?: string;
    is_premium?: boolean;
    documents_processed?: number;
  }) {
    try {
      const [row] = await db.insert(user_profiles).values(input).returning();
      return row || null;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw new Error(`Failed to create user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<typeof user_profiles.$inferSelect>) {
    try {
      const [row] = await db.update(user_profiles).set(updates).where(eq(user_profiles.id, userId)).returning();
      return row || null;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error(`Failed to update user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}


