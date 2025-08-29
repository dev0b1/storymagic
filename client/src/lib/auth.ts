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
      // First check if we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.log('No valid session found, clearing stale data');
        await this.clearStaleAuthData();
        return null;
      }
      
      // Check if session is expired
      if (session.expires_at && session.expires_at * 1000 < Date.now()) {
        console.log('Session expired, attempting refresh...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.log('Session refresh failed, clearing stale data');
          await this.clearStaleAuthData();
          return null;
        }
      }
      
      // Test server connectivity with a lightweight check
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 2000); // 2 second timeout
        
        const serverTest = await fetch('/api/health', { 
          method: 'GET',
          headers: { 'x-health-check': 'true' },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!serverTest.ok) {
          console.log('Server health check failed, session may be stale');
          await this.clearStaleAuthData();
          return null;
        }
      } catch (serverError: unknown) {
        // Check if it's an abort error (timeout) or actual server error
        if (serverError && typeof serverError === 'object' && 'name' in serverError && serverError.name === 'AbortError') {
          console.log('Server health check timed out, clearing stale session data');
        } else {
          console.log('Server not responding, clearing stale session data');
        }
        await this.clearStaleAuthData();
        return null;
      }
      
      // Firefox-specific: Force refresh session if it might be stale
      if (navigator.userAgent.toLowerCase().includes('firefox')) {
        await this.refreshSessionIfNeeded();
      }
      
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !authUser) {
        console.log('Failed to get user from session:', userError?.message);
        // Clear any stale session data
        await this.clearStaleAuthData();
        return null;
      }

      try {
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
      } catch (dbError) {
        console.warn('Failed to fetch user data from database, using auth data only:', dbError);
        // If database query fails, still return user with basic auth data
        return {
          id: authUser.id,
          email: authUser.email!,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0],
          is_premium: false,
          stories_generated: 0,
          subscription_status: 'free',
          subscription_id: null,
          subscription_end_date: null
        };
      }
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      // Clear stale data on error
      await this.clearStaleAuthData();
      return null;
    }
  },

  async signInWithMagicLink(email: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured');
    }

    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      console.log('🔗 Generating magic link for:', email);
      console.log('🔗 Redirect URL:', redirectTo);
      
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          // Magic link expires after 1 hour (3600 seconds)
          // This does NOT affect session duration - only the magic link validity
          shouldCreateUser: true, // Allow new user creation
        },
      });

      if (error) {
        console.error('❌ Magic link generation failed:', error);
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code || error.status,
          name: error.name
        });
        throw error;
      }
      
      console.log('✅ Magic link generated successfully');
      console.log('📊 Magic link will expire in 1 hour');
      console.log('📊 Magic link data:', data);
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
      // Clear ALL localStorage items related to user session
      localStorage.removeItem('demo_user');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('is_premium');
      localStorage.removeItem('stories_generated');
      localStorage.removeItem('subscription_status');
      
      // Clear any cached redirect paths
      sessionStorage.removeItem('redirectAfterAuth');
      
      // Attempt to sign out of Supabase if configured
      if (isSupabaseConfigured) {
        // This invalidates the current session AND any pending magic links
        // Supabase automatically invalidates magic links when user logs out
        const { error } = await supabase.auth.signOut({ scope: 'global' }); // Global signout invalidates everywhere
        if (error && !error.message.includes('session_not_found')) {
          console.warn('Signout error (continuing anyway):', error);
          // Don't throw - continue with cleanup even if signout fails
        }
        console.log('✅ Supabase session invalidated (including any pending magic links)');
      }
      
      // Clear session manager state
      try {
        const { sessionManager } = await import('./session-manager');
        sessionManager.clearSession();
      } catch (importError) {
        console.warn('Failed to import session manager:', importError);
      }
      
      // Additional cleanup for different browsers
      await this.clearStaleAuthData();
      
      return { success: true };
    } catch (error) {
      console.error('Sign out failed:', error);
      
      // Even if signout fails, still clear local data
      try {
        await this.clearStaleAuthData();
        const { sessionManager } = await import('./session-manager');
        sessionManager.clearSession();
      } catch (cleanupError) {
        console.warn('Failed cleanup after signout error:', cleanupError);
      }
      
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
  },

  // Firefox-specific: Refresh session if it might be stale
  async refreshSessionIfNeeded() {
    if (!isSupabaseConfigured) return;
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session && session.expires_at) {
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = session.expires_at;
        
        // If token expires within 5 minutes, refresh it
        if (expiresAt - now < 300) {
          console.log('Refreshing potentially stale session for Firefox...');
          await supabase.auth.refreshSession();
        }
      }
    } catch (error) {
      console.warn('Failed to refresh session:', error);
      // Don't throw - let the main flow handle auth errors
    }
  },

  // Clear stale authentication data
  async clearStaleAuthData() {
    try {
      console.log('Clearing stale auth data...');
      
      // Clear Supabase session
      if (isSupabaseConfigured) {
        await supabase.auth.signOut({ scope: 'local' }); // Local signout only
      }
      
      // Clear browser storage more aggressively for Firefox
      const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
      if (isFirefox) {
        // Clear all supabase-related items from localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('supabase') || key.includes('sb-'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Clear sessionStorage as well
        const sessionKeysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (key.includes('supabase') || key.includes('sb-'))) {
            sessionKeysToRemove.push(key);
          }
        }
        sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
      }
    } catch (error) {
      console.warn('Failed to clear stale auth data:', error);
    }
  }
};
