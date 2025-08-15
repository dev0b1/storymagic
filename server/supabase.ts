import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

// Determine if we should attempt Supabase calls
const canUseSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  && !supabaseUrl.includes('your-project')
  && !supabaseServiceKey.includes('your-service-role-key');

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Fallback in-memory storage
const fallbackStorage = {
  users: new Map<string, any>(),
  stories: new Map<string, any>(),
  nextStoryId: 1
};

// Database types
export interface User {
  id: string;
  email: string;
  name?: string;
  is_premium: boolean;
  stories_generated: number;
  created_at: string;
  updated_at: string;
}

export interface Story {
  id: string;
  user_id: string;
  input_text: string;
  output_story: string;
  narration_mode: string;
  content_type: string;
  source: string;
  story_id?: string;
  used_fallback: boolean;
  created_at: string;
  updated_at: string;
}

// Database validation
async function validateDatabase() {
  if (!canUseSupabase) {
    console.log('⚠️ Using fallback storage - Supabase not configured');
    return false;
  }

  try {
    // Check if tables exist by attempting to count rows
    const { count: userCount, error: userError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: storyCount, error: storyError } = await supabase
      .from('stories')
      .select('*', { count: 'exact', head: true });

    if (userError || storyError) {
      console.error('❌ Database validation failed:');
      if (userError) console.error('Users table error:', userError.message);
      if (storyError) console.error('Stories table error:', storyError.message);
      return false;
    }

    console.log('✅ Database validation successful:');
    console.log(`- Users table exists (${userCount ?? 0} rows)`);
    console.log(`- Stories table exists (${storyCount ?? 0} rows)`);
    return true;
  } catch (error) {
    console.error('❌ Database validation error:', error);
    return false;
  }
}

// Database operations with fallback
export const db = {
  async setupDatabase() {
    if (!canUseSupabase) {
      console.log('⚠️ Cannot setup database - Supabase not configured');
      return false;
    }

    try {
      const setupSql = `
        -- Create users table if it doesn't exist
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          name TEXT,
          is_premium BOOLEAN DEFAULT FALSE,
          stories_generated INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create stories table if it doesn't exist
        CREATE TABLE IF NOT EXISTS stories (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
          input_text TEXT NOT NULL,
          output_story TEXT NOT NULL,
          narration_mode TEXT NOT NULL DEFAULT 'balanced',
          content_type TEXT DEFAULT 'general',
          source TEXT DEFAULT 'text',
          story_id TEXT,
          used_fallback BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
        CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

        -- Enable RLS
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

        -- RLS policies for users
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view their own data'
          ) THEN
            CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid()::text = id);
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update their own data'
          ) THEN
            CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid()::text = id);
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert their own data'
          ) THEN
            CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (auth.uid()::text = id);
          END IF;
        END $$;

        -- RLS policies for stories
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'stories' AND policyname = 'Users can view their own stories'
          ) THEN
            CREATE POLICY "Users can view their own stories" ON stories FOR SELECT USING (auth.uid()::text = user_id);
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'stories' AND policyname = 'Users can insert their own stories'
          ) THEN
            CREATE POLICY "Users can insert their own stories" ON stories FOR INSERT WITH CHECK (auth.uid()::text = user_id);
          END IF;
        END $$;
      `;

      const { error } = await supabase.rpc('exec_sql', { sql: setupSql });
      
      if (error) {
        console.error('❌ Database setup error:', error);
        return false;
      }

      console.log('✅ Database setup completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Database setup error:', error);
      return false;
    }
  },

  validateDatabase,
  // User operations
  async getUser(userId: string): Promise<User | null> {
    if (!canUseSupabase) {
      return fallbackStorage.users.get(userId) || null;
    }
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user:', error);
        // Fallback to in-memory storage
        return fallbackStorage.users.get(userId) || null;
      }
      
      return data;
    } catch (error) {
      console.error('Supabase connection failed, using fallback storage');
      return fallbackStorage.users.get(userId) || null;
    }
  },

  async getUserByEmail(email: string): Promise<User | null> {
    if (!canUseSupabase) {
      // Convert Map values to array before iteration
      const users = Array.from(fallbackStorage.users.values());
      const user = users.find(user => user.email === email);
      return user || null;
    }
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error) {
        console.error('Error fetching user by email:', error);
        // Fallback to in-memory storage
        for (const user of fallbackStorage.users.values()) {
          if (user.email === email) return user;
        }
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Supabase connection failed, using fallback storage');
      for (const user of fallbackStorage.users.values()) {
        if (user.email === email) return user;
      }
      return null;
    }
  },

  async createUser(userData: {
    id: string;
    email: string;
    name?: string;
    is_premium?: boolean;
    stories_generated?: number;
  }): Promise<User | null> {
    if (!canUseSupabase) {
      const user = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        is_premium: userData.is_premium || false,
        stories_generated: userData.stories_generated || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      fallbackStorage.users.set(userData.id, user);
      return user;
    }
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          id: userData.id,
          email: userData.email,
          name: userData.name,
          is_premium: userData.is_premium || false,
          stories_generated: userData.stories_generated || 0
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating user:', error);
        // Fallback to in-memory storage
        const user = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          is_premium: userData.is_premium || false,
          stories_generated: userData.stories_generated || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        fallbackStorage.users.set(userData.id, user);
        return user;
      }
      
      return data;
    } catch (error) {
      console.error('Supabase connection failed, using fallback storage');
      const user = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        is_premium: userData.is_premium || false,
        stories_generated: userData.stories_generated || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      fallbackStorage.users.set(userData.id, user);
      return user;
    }
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    if (!canUseSupabase) {
      const user = fallbackStorage.users.get(userId);
      if (user) {
        const updatedUser = { ...user, ...updates, updated_at: new Date().toISOString() };
        fallbackStorage.users.set(userId, updatedUser);
        return updatedUser;
      }
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating user:', error);
        // Fallback to in-memory storage
        const user = fallbackStorage.users.get(userId);
        if (user) {
          const updatedUser = { ...user, ...updates, updated_at: new Date().toISOString() };
          fallbackStorage.users.set(userId, updatedUser);
          return updatedUser;
        }
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Supabase connection failed, using fallback storage');
      const user = fallbackStorage.users.get(userId);
      if (user) {
        const updatedUser = { ...user, ...updates, updated_at: new Date().toISOString() };
        fallbackStorage.users.set(userId, updatedUser);
        return updatedUser;
      }
      return null;
    }
  },

  // Story operations
  async createStory(storyData: {
    user_id: string;
    input_text: string;
    output_story: string;
    narration_mode: string;
    content_type?: string;
    source?: string;
    story_id?: string;
    used_fallback?: boolean;
  }): Promise<Story | null> {
    if (!canUseSupabase) {
      const story = {
        id: `story_${fallbackStorage.nextStoryId++}`,
        user_id: storyData.user_id,
        input_text: storyData.input_text,
        output_story: storyData.output_story,
        narration_mode: storyData.narration_mode,
        content_type: storyData.content_type || 'general',
        source: storyData.source || 'text',
        story_id: storyData.story_id,
        used_fallback: storyData.used_fallback || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Story;
      fallbackStorage.stories.set(story.id, story);
      return story;
    }
    try {
      const { data, error } = await supabase
        .from('stories')
        .insert([{
          user_id: storyData.user_id,
          input_text: storyData.input_text,
          output_story: storyData.output_story,
          narration_mode: storyData.narration_mode,
          content_type: storyData.content_type || 'general',
          source: storyData.source || 'text',
          story_id: storyData.story_id,
          used_fallback: storyData.used_fallback || false
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating story:', error);
        // Fallback to in-memory storage
        const story = {
          id: `story_${fallbackStorage.nextStoryId++}`,
          user_id: storyData.user_id,
          input_text: storyData.input_text,
          output_story: storyData.output_story,
          narration_mode: storyData.narration_mode,
          content_type: storyData.content_type || 'general',
          source: storyData.source || 'text',
          story_id: storyData.story_id,
          used_fallback: storyData.used_fallback || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        fallbackStorage.stories.set(story.id, story);
        return story;
      }
      
      return data;
    } catch (error) {
      console.error('Supabase connection failed, using fallback storage');
      const story = {
        id: `story_${fallbackStorage.nextStoryId++}`,
        user_id: storyData.user_id,
        input_text: storyData.input_text,
        output_story: storyData.output_story,
        narration_mode: storyData.narration_mode,
        content_type: storyData.content_type || 'general',
        source: storyData.source || 'text',
        story_id: storyData.story_id,
        used_fallback: storyData.used_fallback || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      fallbackStorage.stories.set(story.id, story);
      return story;
    }
  },

  async getUserStories(userId: string, limit: number = 10): Promise<Story[]> {
    if (!canUseSupabase) {
      const stories = Array.from(fallbackStorage.stories.values())
        .filter(story => story.user_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
      return stories;
    }
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching user stories:', error);
        // Fallback to in-memory storage
        const stories = Array.from(fallbackStorage.stories.values())
          .filter(story => story.user_id === userId)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, limit);
        return stories;
      }
      
      return data || [];
    } catch (error) {
      console.error('Supabase connection failed, using fallback storage');
      const stories = Array.from(fallbackStorage.stories.values())
        .filter(story => story.user_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
      return stories;
    }
  },

  async getStory(storyId: string): Promise<Story | null> {
    if (!canUseSupabase) {
      return fallbackStorage.stories.get(storyId) || null;
    }
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();
      
      if (error) {
        console.error('Error fetching story:', error);
        // Fallback to in-memory storage
        return fallbackStorage.stories.get(storyId) || null;
      }
      
      return data;
    } catch (error) {
      console.error('Supabase connection failed, using fallback storage');
      return fallbackStorage.stories.get(storyId) || null;
    }
  },

  async deleteStory(storyId: string, userId: string): Promise<boolean> {
    if (!canUseSupabase) {
      const story = fallbackStorage.stories.get(storyId);
      if (story && story.user_id === userId) {
        fallbackStorage.stories.delete(storyId);
        return true;
      }
      return false;
    }
    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error deleting story:', error);
        // Fallback to in-memory storage
        const story = fallbackStorage.stories.get(storyId);
        if (story && story.user_id === userId) {
          fallbackStorage.stories.delete(storyId);
          return true;
        }
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Supabase connection failed, using fallback storage');
      const story = fallbackStorage.stories.get(storyId);
      if (story && story.user_id === userId) {
        fallbackStorage.stories.delete(storyId);
        return true;
      }
      return false;
    }
  }
};
