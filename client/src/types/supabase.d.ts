import '@supabase/supabase-js';

declare module '@supabase/supabase-js' {
  interface SupabaseAuthClient {
    getSessionFromUrl?: () => Promise<any>;
    setSession?: (session: { access_token?: string; refresh_token?: string }) => Promise<any>;
  }
}
