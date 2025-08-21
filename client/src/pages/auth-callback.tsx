import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { safeNavigate } from '@/lib/navigation';

export default function AuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const run = async () => {
      try {
        if (!isSupabaseConfigured) {
          safeNavigate(setLocation, '/auth');
          return;
        }
        // Exchange the code from magic link / oauth for a session
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) {
          console.error('Auth callback error:', error);
          safeNavigate(setLocation, '/auth');
          return;
        }
        safeNavigate(setLocation, '/dashboard');
      } catch (e) {
        console.error('Auth callback unexpected error:', e);
        safeNavigate(setLocation, '/auth');
      }
    };

    run();
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
    </div>
  );
}


