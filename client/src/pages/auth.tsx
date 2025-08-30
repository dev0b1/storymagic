import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MagicSparkles } from '@/components/ui/magic-sparkles';
import { authService } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { safeNavigate } from '@/lib/navigation';
import { ConfigError } from '@/components/config-error';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  if (!isSupabaseConfigured) {
    return (
      <ConfigError 
        message="Authentication is not configured. Please add your Supabase credentials to the environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)."
      />
    );
  }

  useEffect(() => {
    // Check for error parameter in URL and existing session on mount
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
      setErrorMessage(decodeURIComponent(error));
      window.history.replaceState({}, document.title, window.location.pathname);
      toast({
        title: 'Authentication Error',
        description: decodeURIComponent(error),
        variant: 'destructive',
      });
    }

    const checkSession = async () => {
      const user = await authService.getCurrentUser();
      if (user) safeNavigate(setLocation, '/dashboard');
    };
    checkSession();
  }, [setLocation, toast]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative flex items-center justify-center p-4">
      <MagicSparkles />
      <div className="relative z-10 bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-200">
        <Link href="/">
          <Button variant="ghost" size="sm" className="absolute top-4 right-4 text-gray-500 hover:text-gray-700" data-testid="button-close">
            <X className="w-5 h-5" />
          </Button>
        </Link>

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to StoryMagic</h3>
          <p className="text-gray-600">Sign in with Google to continue</p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={async () => {
              setIsLoading(true);
              try {
                await authService.signInWithGoogle();
                toast({ title: 'Redirecting to Google...', description: 'Please complete the sign in process' });
              } catch (error) {
                toast({ title: 'Sign in failed', description: error instanceof Error ? error.message : 'Please try again', variant: 'destructive' });
                setIsLoading(false);
              }
            }}
            variant="outline"
            className="w-full mb-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 flex items-center justify-center gap-2"
            disabled={isLoading}
            data-testid="button-google-login"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">...</svg>
            Continue with Google
          </Button>

          {/* Demo login removed - use Google sign-in only */}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">No passwords needed - just pure magic ✨</p>
      </div>
    </div>
  );
}
