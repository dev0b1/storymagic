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
    // Strict server-side OAuth flow only.
    // If we got an authorization code from Google, forward it to the server
    // which will exchange it for a Supabase session using the service key.
    const handle = async () => {
      setIsProcessing(true);
      try {
        if (!isSupabaseConfigured) {
          throw new Error('Supabase not configured');
        }

        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const next = url.searchParams.get('next') || '/dashboard';
        if (code) {
          const forwardUrl = `/auth/callback-code?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`;
          window.location.href = forwardUrl;
          return;
        }

        // No code present — we only support server-side OAuth code exchange.
        throw new Error('No authorization code found. Please sign in via Google from the sign in page.');
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err?.message || String(err));
        setTimeout(() => safeNavigate(setLocation, '/auth?error=' + encodeURIComponent(err?.message || String(err))), 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    handle();
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