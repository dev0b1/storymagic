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
    const handleAuthCallback = async () => {
      setIsProcessing(true);
      try {
        setStatus('Processing authentication...');
        
        if (!isSupabaseConfigured) {
          throw new Error('Supabase not configured');
        }
        console.log("Full url:", window.location.href);
        console.log('🔍 URL Hash:', window.location.hash);

        setStatus('Getting session...');
        // First, try the SDK helper which consumes tokens from the URL
        // (supabase v2+ provides getSessionFromUrl which parses the fragment).
        try {
          const authAny = supabase.auth as any;
          if (typeof authAny.getSessionFromUrl === 'function') {
            const fromUrl = await authAny.getSessionFromUrl();
            if (fromUrl && fromUrl.data && fromUrl.data.session) {
              console.log('✅ Session parsed from URL via getSessionFromUrl');
              setStatus('Login successful! Redirecting...');
              // Clear URL after successful processing
              window.history.replaceState({}, document.title, window.location.pathname);
              const redirectPath = sessionStorage.getItem('redirectAfterAuth') || '/dashboard';
              sessionStorage.removeItem('redirectAfterAuth');
              safeNavigate(setLocation, redirectPath);
              return;
            }
          }
        } catch (err) {
          console.debug('getSessionFromUrl not available or failed:', err);
        }

        // If tokens are present in the hash, try to set the session manually.
        const hash = window.location.hash || '';
        const waitForSession = async (timeoutMs = 3000, intervalMs = 150) => {
          const start = Date.now();
          while (Date.now() - start < timeoutMs) {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (session) return session;
            } catch (e) {
              // ignore and retry
            }
            await new Promise((r) => setTimeout(r, intervalMs));
          }
          return null;
        };

        if (hash.includes('access_token')) {
          try {
            const params = Object.fromEntries(new URLSearchParams(hash.replace(/^#/, '')));
            if (params.access_token) {
              const authAny = supabase.auth as any;
              if (typeof authAny.setSession === 'function') {
                const { error: setErr } = await authAny.setSession({
                  access_token: params.access_token,
                  refresh_token: params.refresh_token,
                });
                if (setErr) {
                  console.warn('setSession reported error:', setErr);
                } else {
                  console.log('✅ Session set from URL fragment');
                  setStatus('Login successful! Redirecting...');
                  // Wait for SDK/storage to reflect the session (polling)
                  const s = await waitForSession(3000, 150);
                  if (!s) console.warn('Timed out waiting for session to become available');
                  window.history.replaceState({}, document.title, window.location.pathname);
                  const redirectPath = sessionStorage.getItem('redirectAfterAuth') || '/dashboard';
                  sessionStorage.removeItem('redirectAfterAuth');
                  console.log('Navigating to', redirectPath);
                  safeNavigate(setLocation, redirectPath);
                  return;
                }
              } else {
                console.warn('setSession is not available on the Supabase client');
              }
            }
          } catch (err) {
            console.warn('Failed to set session from hash:', err);
          }
        }

        // Last resort: try a plain getSession (may return if SDK processed URL automatically)
        const { data:{session}, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.log("💥 Exchange error:", sessionError);
          throw sessionError;
        }
        if (session) {
          console.log('✅ magic link session established successfully via getSession');
          setStatus('Login successful! Redirecting...');
          window.history.replaceState({}, document.title, window.location.pathname);
          const redirectPath = sessionStorage.getItem('redirectAfterAuth') || '/dashboard';
          sessionStorage.removeItem('redirectAfterAuth');
          safeNavigate(setLocation, redirectPath);
          return;
        }

        throw new Error('Session exchange completed but no session was returned');

      } catch (err: any) {
        console.error('💥 Auth callback error:', err);
        setError(err.message);
        setTimeout(() => safeNavigate(setLocation, '/auth?error=' + encodeURIComponent(err.message)), 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
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