import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MagicSparkles } from '@/components/ui/magic-sparkles';
import { authService } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Send, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { ConfigError } from '@/components/config-error';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
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
    // Check for existing session on mount
    const checkSession = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        setLocation('/dashboard');
      }
    };
    checkSession();
  }, [setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      // Auto-login for demo account
      if (email.toLowerCase() === 'demo@gmail.com') {
        console.log('Attempting demo login...');
        const response = await fetch('/api/demo-login', { method: 'POST' });
        const user = await response.json();
        console.log('Demo login successful:', user);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userName', user.name || '');
        toast({
          title: "Welcome to StoryMagic!",
          description: "Logged in as Demo User",
        });
        setLocation('/dashboard');
        return;
      }

      await authService.signInWithMagicLink(email);
      setEmailSent(true);
      toast({
        title: "Magic link sent! ✨",
        description: "Check your email for the magical portal link"
      });
    } catch (error) {
      toast({
        title: "Magic failed",
        description: "Please try again with a valid email",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-pink-100 to-white relative flex items-center justify-center p-4">
        <MagicSparkles />
        
        <div className="relative z-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-gray-300">
          <div className="text-center">
            <div className="text-6xl mb-4">📧</div>
            <h3 className="font-magical text-3xl text-purple-800 mb-4">Magic Link Sent!</h3>
            <p className="text-gray-600 mb-6">
              Check your email for a magical portal link to enter the realm of Story Whirl ✨
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Sent to: <strong>{email}</strong>
            </p>
            <Button 
              onClick={() => setEmailSent(false)}
              variant="outline"
              className="mb-4"
            >
              Try Different Email
            </Button>
            <div className="text-xs text-gray-400">
              Didn't receive it? Check your spam folder or try again
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-pink-100 to-white relative flex items-center justify-center p-4">
      <MagicSparkles />
      
      <div className="relative z-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-gray-300">
        <Link href="/">
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            data-testid="button-close"
          >
            <X className="w-5 h-5" />
          </Button>
        </Link>
        
        <div className="text-center mb-8">
          <Sparkles className="text-4xl text-purple-600 mb-4 mx-auto w-12 h-12 animate-spin" />
          <h3 className="font-magical text-3xl text-purple-800 mb-2">Enter the Realm</h3>
          <p className="text-gray-600">Magic link will be sent to your scroll</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              type="email" 
              placeholder="Enter email or try: demo@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              required
              data-testid="input-email"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading || !email.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            data-testid="button-send-magic-link"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending Magic...
              </div>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Magic Link
              </>
            )}
          </Button>
        </form>
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gradient-to-br from-gray-100 to-gray-200 px-2 text-gray-500">Or</span>
          </div>
        </div>

        <Button
          onClick={async () => {
            setIsLoading(true);
            try {
              await authService.signInWithGoogle();
              toast({
                title: "Redirecting to Google...",
                description: "Please complete the sign in process",
              });
            } catch (error) {
              toast({
                title: "Sign in failed",
                description: error instanceof Error ? error.message : "Please try again",
                variant: "destructive"
              });
              setIsLoading(false);
            }
          }}
          variant="outline"
          className="w-full mb-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 flex items-center justify-center gap-2"
          disabled={isLoading}
          data-testid="button-google-login"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gradient-to-br from-gray-100 to-gray-200 px-2 text-gray-500">Or try demo</span>
          </div>
        </div>
        
        <Button 
          onClick={async () => {
            setIsLoading(true);
            try {
              console.log('Attempting demo login...');
              const response = await fetch('/api/demo-login', { method: 'POST' });
              console.log('Demo login response status:', response.status);
              
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
              
              const user = await response.json();
              console.log('Demo user data:', user);
              
              localStorage.setItem('userId', user.id);
              localStorage.setItem('userEmail', user.email);
              localStorage.setItem('userName', user.name || '');
              
              console.log('LocalStorage set, redirecting to dashboard...');
              setLocation('/dashboard');
            } catch (error) {
              console.error('Demo login error:', error);
              toast({
                title: "Demo login failed",
                description: error instanceof Error ? error.message : "Please try again",
                variant: "destructive"
              });
            } finally {
              setIsLoading(false);
            }
          }}
          variant="outline" 
          className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 py-3"
          data-testid="button-demo-login"
        >
          Try Demo (demo@gmail.com)
        </Button>
        
        <p className="text-center text-sm text-gray-500 mt-6">
          No passwords needed - just pure magic ✨
        </p>
      </div>
    </div>
  );
}
