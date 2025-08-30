import { useEffect } from 'react';
import { useLocation } from 'wouter';

// This page intentionally does not perform any OAuth code exchange.
// Configure your Google OAuth redirect URL to your server's
// code-exchange endpoint (for example: /auth/callback-code).
export default function AuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Make this page passive: inform the user and navigate them back to the sign-in page.
    const t = setTimeout(() => {
      setLocation('/auth');
    }, 3500);

    return () => clearTimeout(t);
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-xl text-center p-6">
        <h2 className="text-2xl font-semibold mb-4">Auth Callback (Frontend Disabled)</h2>
        <p className="text-gray-600 mb-4">
          This frontend page no longer acts as an OAuth proxy. Please configure your Google
          OAuth redirect URL to point directly at the server code-exchange endpoint
          (<code>/auth/callback-code</code>), then try signing in again.
        </p>
        <p className="text-sm text-gray-500">You will be redirected to the sign-in page shortly.</p>
      </div>
    </div>
  );
}