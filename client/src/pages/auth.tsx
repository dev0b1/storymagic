import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MagicSparkles } from '@/components/ui/magic-sparkles';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Send, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      // Auto-login for demo account
      if (email.toLowerCase() === 'demo@gmail.com') {
        const response = await fetch('/api/demo-login', { method: 'POST' });
        const user = await response.json();
        localStorage.setItem('userId', user.id);
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userName', user.name || '');
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
              const response = await fetch('/api/demo-login', { method: 'POST' });
              const user = await response.json();
              localStorage.setItem('userId', user.id);
              setLocation('/dashboard');
            } catch (error) {
              toast({
                title: "Demo login failed",
                description: "Please try again",
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
