import { Button } from '@/components/ui/button';
import { MagicSparkles } from '@/components/ui/magic-sparkles';
import { Sparkles, LogIn } from 'lucide-react';
import { Link } from 'wouter';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-pink-100 to-white relative">
      <MagicSparkles />
      
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <Sparkles className="text-2xl text-purple-600 animate-bounce" />
            <h1 className="font-magical text-2xl text-purple-800" style={{ textShadow: '0 0 10px rgba(147, 51, 234, 0.5)' }}>
              Story Whirl
            </h1>
          </div>
          <Link href="/auth">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
          </Link>
        </nav>

        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="mb-8 relative">
            <div className="rounded-3xl shadow-2xl w-full h-64 bg-gradient-to-br from-purple-400 via-pink-300 to-indigo-300 flex items-center justify-center opacity-90 mx-auto">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">🌟✨🦉</div>
                <p className="text-xl font-magical">Magical Forest of Stories</p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 to-transparent rounded-3xl"></div>
          </div>
          
          <h2 className="font-magical text-5xl md:text-7xl text-purple-800 mb-6 animate-pulse" 
              style={{ textShadow: '0 0 20px rgba(147, 51, 234, 0.3)' }}>
            Turn Any Text into a Magical, Narrated Tale
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Transform boring summaries into whimsical adventures in 60 seconds
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center mb-16">
            <Link href="/auth">
              <Button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xl px-12 py-4 font-bold transition-all duration-300 hover:scale-105 shadow-xl"
                data-testid="button-try-free"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Try it Free
              </Button>
            </Link>
            <Button 
              onClick={async () => {
                try {
                  const response = await fetch('/api/demo-login', { method: 'POST' });
                  const user = await response.json();
                  localStorage.setItem('userId', user.id);
                  localStorage.setItem('userEmail', user.email);
                  localStorage.setItem('userName', user.name || '');
                  window.location.href = '/dashboard';
                } catch (error) {
                  console.error('Demo login failed:', error);
                }
              }}
              variant="outline" 
              className="border-purple-300 text-purple-700 hover:bg-purple-50 text-xl px-8 py-4 font-medium"
              data-testid="button-demo"
            >
              🚀 Demo (Instant Access)
            </Button>
          </div>

          {/* Demo Preview */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-2xl max-w-4xl mx-auto" 
               style={{ boxShadow: '0 4px 20px rgba(147, 51, 234, 0.1)' }}>
            <h3 className="font-magical text-2xl text-purple-800 mb-6">✨ See the Magic in Action</h3>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 text-left">📝 Your Input:</h4>
                <div className="bg-gray-100 p-4 rounded-xl text-left text-sm">
                  "The solar system consists of the Sun and eight planets. Mercury is the closest to the Sun, followed by Venus, Earth, and Mars..."
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 text-left">🦉 Lumi's Magical Story:</h4>
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl text-left text-sm">
                  "Once upon a time, in the vast cosmic library of the universe, there lived a wise old Sun who kept watch over eight magical realms called planets..."
                </div>
                <button className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors">
                  <span className="text-sm">🔊 Listen to Story</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
