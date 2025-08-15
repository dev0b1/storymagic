import { supabase, isSupabaseConfigured } from './supabase';

export interface User {
  id: string;
  email: string;
  name?: string;
  is_premium?: boolean;
  stories_generated?: number;
}

export const authService = {
  async signInWithMagicLink(email: string) {
    if (!isSupabaseConfigured) {
      return { success: false, error: new Error('Authentication is not configured') };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return { success: true };
  },

  async signInWithGoogle() {
    if (!isSupabaseConfigured) {
      return { success: false, error: new Error('Authentication is not configured') };
    }

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
  },

  async getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (!supabaseUser) return null;

    const { data: userData, error } = await supabase
      .from('users')
      .select('is_premium, stories_generated')
      .eq('id', supabaseUser.id)
      .single();

    if (error) {
      console.error('Error fetching user data:', error);
    }

    return {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0],
      is_premium: userData?.is_premium || false,
      stories_generated: userData?.stories_generated || 0,
    };
  },

  async signOut() {
    if (!isSupabaseConfigured) {
      return { success: true }; // Always succeed signout if not configured
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    if (!isSupabaseConfigured) {
      // Return a no-op unsubscribe function if not configured
      callback(null);
      return { data: { subscription: { unsubscribe: () => {} } } };
    }

    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        const user = await this.getCurrentUser();
        callback(user);
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      }
    });
  },
};
