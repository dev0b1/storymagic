import { createClient, SupabaseClient, AuthChangeEvent, Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Log Supabase configuration status
console.log('🔑 Supabase Configuration Status:', {
  isConfigured: isSupabaseConfigured,
  url: supabaseUrl ? '✅ Set' : '❌ Missing',
  anonKey: supabaseAnonKey ? '✅ Set' : '❌ Missing'
});

// Create a mock client that returns empty results when Supabase is not configured
const mockClient = {
  auth: {
    signInWithOtp: async () => ({ data: null, error: new Error('Supabase not configured') }),
    signInWithOAuth: async () => ({ data: null, error: new Error('Supabase not configured') }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null })
      })
    })
  })
} as unknown as SupabaseClient;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : mockClient;

export interface User {
  id: string;
  email: string;
  name?: string;
  is_premium?: boolean;
  stories_generated?: number;
}

export const authService = {
  async signInWithMagicLink(email: string) {
  throw new Error('Magic link sign-in has been disabled. Use Google sign-in or demo.');
  },

  async signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: 'select_account consent',
          access_type: 'offline',
        },
        scopes: 'email profile',
      },
    });

    if (error) throw error;
    return { success: true };
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get additional user data from our users table
    const { data: userData, error } = await supabase
      .from('users')
      .select('is_premium, stories_generated')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user data:', error);
    }

    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.email?.split('@')[0],
      is_premium: userData?.is_premium || false,
      stories_generated: userData?.stories_generated || 0,
    };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        const user = await this.getCurrentUser();
        callback(user);
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      }
    });
  },
};
