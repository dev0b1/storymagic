import { supabase, isSupabaseConfigured } from './supabase';

export interface User {
  id: string;
  email: string;
  name?: string;
  is_premium?: boolean;
  stories_generated?: number;
  subscription_status?: string;
  subscription_id?: string | null;
  subscription_end_date?: string | null;
}

export const authService = {
  async setDemoSession(user: User & { access_token?: string; refresh_token?: string }) {
    // Demo sessions should not touch Supabase auth. Persist lightweight demo state locally.
    try {
      localStorage.setItem('demo_user', 'true');
      localStorage.setItem('userId', user.id);
      localStorage.setItem('userEmail', user.email);
      if (user.name) localStorage.setItem('userName', user.name);
      if (typeof user.is_premium !== 'undefined') localStorage.setItem('is_premium', user.is_premium ? 'true' : 'false');
      if (typeof user.stories_generated !== 'undefined') localStorage.setItem('stories_generated', String(user.stories_generated));
    } catch (error) {
      console.error('Demo session local persist failed:', error);
      throw error;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    // First, honor demo session if present
    const isDemo = localStorage.getItem('demo_user') === 'true';
    if (isDemo) {
      const id = localStorage.getItem('userId') || 'demo@gmail.com';
      const email = localStorage.getItem('userEmail') || 'demo@gmail.com';
      const name = localStorage.getItem('userName') || 'Demo User';
      const is_premium = localStorage.getItem('is_premium') === 'true';
      const stories_generated = Number(localStorage.getItem('stories_generated') || '0');
      return { id, email, name, is_premium, stories_generated, subscription_status: 'free', subscription_id: null, subscription_end_date: null };
    }

    // Otherwise, use Supabase session
    if (!isSupabaseConfigured) return null;
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return null;

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      return {
        id: authUser.id,
        email: authUser.email!,
        name: userData?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0],
        is_premium: userData?.is_premium || false,
        stories_generated: userData?.stories_generated || 0,
        subscription_status: userData?.subscription_status || 'free',
        subscription_id: userData?.subscription_id || null,
        subscription_end_date: userData?.subscription_end_date || null
      };
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return null;
    }
  },

  async signInWithMagicLink(email: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured');
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return { success: true };

    } catch (error) {
      console.error('Magic link sign in failed:', error);
      return { success: false, error };
    }
  },

  async signInWithGoogle() {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured');
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (error) throw error;
      return { success: true };

    } catch (error) {
      console.error('Google sign in failed:', error);
      return { success: false, error };
    }
  },

  async signOut() {
    try {
      // Clear demo markers, if any
      localStorage.removeItem('demo_user');
      // Attempt to sign out of Supabase if configured
      if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      }
      return { success: true };
    } catch (error) {
      console.error('Sign out failed:', error);
      return { success: false, error };
    }
  },

  async updateUser(updates: Partial<User>) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured');
    }

    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      // Update user data in database
      const { data, error } = await supabase
        .from('users')
        .update({
          name: updates.name,
          is_premium: updates.is_premium,
          stories_generated: updates.stories_generated,
          subscription_status: updates.subscription_status,
          subscription_id: updates.subscription_id,
          subscription_end_date: updates.subscription_end_date
        })
        .eq('id', currentUser.id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update user:', error);
        throw error;
      }

      return data;

    } catch (error) {
      console.error('Error in updateUser:', error);
      throw error;
    }
  },

  async incrementStoryCount() {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const newCount = (currentUser.stories_generated || 0) + 1;
      
      const { data, error } = await supabase
        .from('users')
        .update({ stories_generated: newCount })
        .eq('id', currentUser.id)
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Error incrementing story count:', error);
      throw error;
    }
  },

  async updateLocalUser(updates: Partial<User>) {
    try {
      const isDemo = localStorage.getItem('demo_user') === 'true';
      if (!isDemo) return; // Only persists for demo
      if (updates.id) localStorage.setItem('userId', updates.id);
      if (updates.email) localStorage.setItem('userEmail', updates.email);
      if (typeof updates.name !== 'undefined') localStorage.setItem('userName', updates.name || '');
      if (typeof updates.is_premium !== 'undefined') localStorage.setItem('is_premium', updates.is_premium ? 'true' : 'false');
      if (typeof updates.stories_generated !== 'undefined') localStorage.setItem('stories_generated', String(updates.stories_generated));
      if (typeof updates.subscription_status !== 'undefined') localStorage.setItem('subscription_status', updates.subscription_status || 'free');
    } catch (error) {
      console.warn('Failed to update local user storage:', error);
    }
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    // If demo session is active, immediately callback with demo user and no subscription
    if (localStorage.getItem('demo_user') === 'true') {
      this.getCurrentUser().then(callback);
      return { data: { subscription: { unsubscribe: () => {} } } } as any;
    }

    if (!isSupabaseConfigured) {
      callback(null);
      return { data: { subscription: { unsubscribe: () => {} } } } as any;
    }

    return supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        const user = await this.getCurrentUser();
        callback(user);
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      }
    });
  },

  // Helper method to check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },

  // Helper method to get current session
  async getSession() {
    if (!isSupabaseConfigured) return null;
    
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }
};