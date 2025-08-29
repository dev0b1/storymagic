import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { safeNavigate } from '@/lib/navigation';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Initializing...');
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    let subscription: any = null;
    const handleAuthCallback = async () => {
      setIsProcessing(true);
      try {
        setStatus('Processing authentication...');

        if (!isSupabaseConfigured) {
          throw new Error('Supabase not configured');
        }

        // Immediate session check
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('Session already present, navigating...');
          window.history.replaceState({}, document.title, window.location.pathname);
          const redirectPath = sessionStorage.getItem('redirectAfterAuth') || '/dashboard';
          sessionStorage.removeItem('redirectAfterAuth');
          safeNavigate(setLocation, redirectPath);
          return;
        }

        // Subscribe to auth state changes. When Supabase resolves the magic link
        // it will trigger onAuthStateChange with the new session.
        const resp = supabase.auth.onAuthStateChange((_event, newSession) => {
          if (newSession) {
            console.log('onAuthStateChange fired, session available');
            try {
              subscription?.unsubscribe();
            } catch (e) {}
            window.history.replaceState({}, document.title, window.location.pathname);
            const redirectPath = sessionStorage.getItem('redirectAfterAuth') || '/dashboard';
            sessionStorage.removeItem('redirectAfterAuth');
            safeNavigate(setLocation, redirectPath);
          }
        });

        // store subscription for cleanup
        subscription = resp.data?.subscription;
      } catch (err: any) {
        console.error('💥 Auth callback error:', err);
        setError(err.message);
        setTimeout(() => safeNavigate(setLocation, '/auth?error=' + encodeURIComponent(err.message)), 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();

    return () => {
      try {
        subscription?.unsubscribe();
      } catch (e) {}
    };
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center max-w-md mx-auto px-4">
        {isProcessing && (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        )}
        <p className="mt-4 text-gray-600 text-center">{status}</p>
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg w-full">
            <p className="text-red-700 font-semibold mb-2">Error Details:</p>
            <p className="text-red-600 text-sm">{error}</p>
            <p className="text-gray-500 text-xs mt-2">Redirecting to login in 3 seconds...</p>
          </div>
        )}
        <div className="mt-6 p-3 bg-gray-50 border rounded text-xs text-gray-600 w-full">
          <p><strong>URL:</strong> {window.location.href}</p>
          <p><strong>Hash Fragment:</strong> {window.location.hash || 'None'}</p>
          <p><strong>Query Parameters:</strong> {window.location.search || 'None'}</p>
        </div>
      </div>
    </div>
  );
}