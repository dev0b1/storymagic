import { createClient } from '@supabase/supabase-js';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';

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
  subscriptions: new Map<string, any>(),
  nextStoryId: 1,
  nextSubId: 1,
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
  // subscription extras
  subscription_status?: 'free' | 'active' | 'inactive' | 'cancelled';
  subscription_id?: string | null;
  subscription_end_date?: string | null;
  // payment provider ids
  paystack_customer_id?: string | null;
  paystack_customer_code?: string | null;
  // legacy stripe (optional, for backward compatibility)
  stripe_customer_id?: string | null;
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
  audio_url?: string;
  audio_provider?: string;
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
      // Skip migrations entirely for now - they should be run manually in Supabase dashboard
      // or via Supabase CLI. The RPC exec_sql function doesn't exist by default.
      console.log('⚠️ Skipping migrations - please run them manually in Supabase dashboard');
      console.log('💡 You can find the migration files in server/migrations/');
      
      // Just validate that the database is accessible
      const isValid = await validateDatabase();
      if (isValid) {
        console.log('✅ Database is accessible and tables exist');
        return true;
      } else {
        console.log('⚠️ Database tables may need to be created manually');
        console.log('💡 Run the SQL from server/migrations/0001_initial_schema.sql in Supabase dashboard');
        return false;
      }
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
      
      return data as unknown as User;
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
      
      return data as unknown as User;
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
  subscription_status?: string | null;
  subscription_id?: string | null;
  subscription_end_date?: string | null;
  paystack_customer_id?: string | null;
  paystack_customer_code?: string | null;
  stripe_customer_id?: string | null;
  }): Promise<User | null> {
    if (!canUseSupabase) {
      const user = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        is_premium: userData.is_premium || false,
        stories_generated: userData.stories_generated || 0,
        subscription_status: userData.subscription_status || 'free',
        subscription_id: userData.subscription_id || null,
        subscription_end_date: userData.subscription_end_date || null,
        paystack_customer_id: userData.paystack_customer_id || null,
        paystack_customer_code: userData.paystack_customer_code || null,
        stripe_customer_id: userData.stripe_customer_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as User;
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
          stories_generated: userData.stories_generated || 0,
          subscription_status: userData.subscription_status || 'free',
          subscription_id: userData.subscription_id || null,
          subscription_end_date: userData.subscription_end_date || null,
          paystack_customer_id: userData.paystack_customer_id || null,
          paystack_customer_code: userData.paystack_customer_code || null,
          stripe_customer_id: userData.stripe_customer_id || null,
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
        } as User;
        fallbackStorage.users.set(userData.id, user);
        return user;
      }
      
      return data as unknown as User;
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
      } as User;
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
        return updatedUser as User;
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
          return updatedUser as User;
        }
        return null;
      }
      
      return data as unknown as User;
    } catch (error) {
      console.error('Supabase connection failed, using fallback storage');
      const user = fallbackStorage.users.get(userId);
      if (user) {
        const updatedUser = { ...user, ...updates, updated_at: new Date().toISOString() };
        fallbackStorage.users.set(userId, updatedUser);
        return updatedUser as User;
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
        return story as Story;
      }
      
      return data as unknown as Story;
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
      return story as Story;
    }
  },

  async getUserStories(userId: string, limit: number = 10): Promise<Story[]> {
    if (!canUseSupabase) {
      const stories = Array.from(fallbackStorage.stories.values())
        .filter(story => story.user_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
      return stories as Story[];
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
        return stories as Story[];
      }
      
      return (data || []) as unknown as Story[];
    } catch (error) {
      console.error('Supabase connection failed, using fallback storage');
      const stories = Array.from(fallbackStorage.stories.values())
        .filter(story => story.user_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
      return stories as Story[];
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
      
      return data as unknown as Story;
    } catch (error) {
      console.error('Supabase connection failed, using fallback storage');
      return fallbackStorage.stories.get(storyId) || null;
    }
  },

  async updateStory(storyId: string, updates: Partial<Story>): Promise<Story | null> {
    if (!canUseSupabase) {
      const story = fallbackStorage.stories.get(storyId);
      if (story) {
        const updatedStory = { ...story, ...updates, updated_at: new Date().toISOString() };
        fallbackStorage.stories.set(storyId, updatedStory);
        return updatedStory as Story;
      }
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('stories')
        .update(updates)
        .eq('id', storyId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating story:', error);
        // Fallback to in-memory storage
        const story = fallbackStorage.stories.get(storyId);
        if (story) {
          const updatedStory = { ...story, ...updates, updated_at: new Date().toISOString() };
          fallbackStorage.stories.set(storyId, updatedStory);
          return updatedStory as Story;
        }
        return null;
      }
      
      return data as unknown as Story;
    } catch (error) {
      console.error('Supabase connection failed, using fallback storage');
      const story = fallbackStorage.stories.get(storyId);
      if (story) {
        const updatedStory = { ...story, ...updates, updated_at: new Date().toISOString() };
        fallbackStorage.stories.set(storyId, updatedStory);
        return updatedStory as Story;
      }
      return null;
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
  },

  async createSubscription(subData: {
    user_id: string;
    lemonsqueezy_subscription_id: string;
    lemonsqueezy_order_id?: string;
    lemonsqueezy_product_id?: string;
    lemonsqueezy_variant_id?: string;
    status: string;
    plan_type: string;
    current_period_start: Date;
    current_period_end: Date;
    amount: number; // in cents (USD)
    currency: string;
  }): Promise<any> {
    if (!canUseSupabase) {
      const id = `sub_${fallbackStorage.nextSubId++}`;
      const record = { id, ...subData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      fallbackStorage.subscriptions.set(id, record);
      return record;
    }
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert([{
          user_id: subData.user_id,
          lemonsqueezy_subscription_id: subData.lemonsqueezy_subscription_id,
          lemonsqueezy_order_id: subData.lemonsqueezy_order_id,
          lemonsqueezy_product_id: subData.lemonsqueezy_product_id,
          lemonsqueezy_variant_id: subData.lemonsqueezy_variant_id,
          status: subData.status,
          plan_type: subData.plan_type,
          current_period_start: subData.current_period_start.toISOString(),
          current_period_end: subData.current_period_end.toISOString(),
          amount: subData.amount,
          currency: subData.currency,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Supabase connection failed while creating subscription', error);
      const id = `sub_${fallbackStorage.nextSubId++}`;
      const record = { id, ...subData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      fallbackStorage.subscriptions.set(id, record);
      return record;
    }
  },

  async getUserByLemonSqueezySubscription(subscriptionId: string): Promise<User | null> {
    if (!canUseSupabase) {
      // Search through fallback users
      for (const user of fallbackStorage.users.values()) {
        if (user.lemonsqueezy_subscription_id === subscriptionId) {
          return user;
        }
      }
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('lemonsqueezy_subscription_id', subscriptionId)
        .single();
      
      if (error || !data) {
        // Search through fallback users
        for (const user of fallbackStorage.users.values()) {
          if (user.lemonsqueezy_subscription_id === subscriptionId) {
            return user;
          }
        }
        return null;
      }
      
      return data as unknown as User;
    } catch (error) {
      console.error('Supabase connection failed, using fallback storage');
      // Search through fallback users
      for (const user of fallbackStorage.users.values()) {
        if (user.lemonsqueezy_subscription_id === subscriptionId) {
          return user;
        }
      }
      return null;
    }
  }
};
