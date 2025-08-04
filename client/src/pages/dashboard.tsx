import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MagicSparkles } from '@/components/ui/magic-sparkles';
import { CharacterCard, CHARACTERS } from '@/components/character-card';
import { StoryDisplay } from '@/components/story-display';
import { ProFeatures } from '@/components/pro-features';
import { authService, type AuthUser } from '@/lib/supabase';
import { storyService } from '@/lib/openrouter';
import type { Story } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Settings, LogOut, Sparkles, Plus } from 'lucide-react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function Dashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [inputText, setInputText] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<'lumi' | 'spark' | 'bella'>('lumi');
  const [generatedStory, setGeneratedStory] = useState('');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        setLocation('/auth');
        return;
      }
      setUser(currentUser);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      if (!user) {
        setLocation('/auth');
      } else {
        setUser(user);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [setLocation]);

  // Fetch user stories
  const { data: stories = [] } = useQuery<Story[]>({
    queryKey: ['/api/stories'],
    enabled: !!user,
    retry: false
  });

  // Story generation mutation
  const generateStoryMutation = useMutation({
    mutationFn: storyService.generateStory,
    onSuccess: (data) => {
      setGeneratedStory(data.story);
      toast({
        title: "Story created! ✨",
        description: "Your magical tale is ready to enjoy"
      });
      // Invalidate stories to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
    },
    onError: (error) => {
      toast({
        title: "Magic failed",
        description: error instanceof Error ? error.message : "Failed to generate story",
        variant: "destructive"
      });
    }
  });

  const handleGenerateStory = () => {
    if (!inputText.trim()) {
      toast({
        title: "Missing text",
        description: "Please enter some text to transform into a story",
        variant: "destructive"
      });
      return;
    }

    generateStoryMutation.mutate({
      text: inputText,
      character: selectedCharacter,
      userId: user?.id
    });
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      setLocation('/');
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const getCharacterBorderColor = (storyChar: string) => {
    switch (storyChar) {
      case 'lumi': return 'border-l-indigo-400';
      case 'spark': return 'border-l-orange-400';
      case 'bella': return 'border-l-purple-400';
      default: return 'border-l-gray-400';
    }
  };

  const getCharacterBgColor = (storyChar: string) => {
    switch (storyChar) {
      case 'lumi': return 'hover:bg-indigo-50';
      case 'spark': return 'hover:bg-orange-50';
      case 'bella': return 'hover:bg-purple-50';
      default: return 'hover:bg-gray-50';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-pink-100 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-pink-100 to-white relative">
      <MagicSparkles />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="font-magical text-3xl text-purple-800" style={{ textShadow: '0 0 10px rgba(147, 51, 234, 0.5)' }}>
              Welcome back, {user.name || 'Storyteller'}!
            </h2>
            <p className="text-gray-600 mt-1">Ready to create some magic?</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="p-2 text-gray-600 hover:text-purple-600">
              <Settings className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="p-2 text-gray-600 hover:text-purple-600"
              data-testid="button-sign-out"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Story Generator */}
          <div className="lg:col-span-2 space-y-6">
            {/* Input Section */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <h3 className="font-magical text-xl text-purple-800 mb-4">✨ Your Text to Transform</h3>
              
              <Textarea
                placeholder="Paste your text, summary, or content here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-32 p-4 border border-purple-200 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                data-testid="textarea-input"
              />
              
              {/* Character Selection */}
              <div className="mt-6">
                <h4 className="font-semibold text-gray-800 mb-4">Choose Your Storyteller:</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  {CHARACTERS.map((character) => (
                    <CharacterCard
                      key={character.id}
                      character={character}
                      selected={selectedCharacter === character.id}
                      onSelect={setSelectedCharacter}
                    />
                  ))}
                </div>
              </div>
              
              <Button
                onClick={handleGenerateStory}
                disabled={generateStoryMutation.isPending || !inputText.trim()}
                className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 font-semibold transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                data-testid="button-generate-story"
              >
                {generateStoryMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Weaving Magic...
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Magical Story
                  </>
                )}
              </Button>
            </div>

            {/* Story Output */}
            <StoryDisplay 
              story={generatedStory}
              character={selectedCharacter}
              isGenerating={generateStoryMutation.isPending}
            />

            {generatedStory && (
              <Button
                onClick={() => {
                  setInputText('');
                  setGeneratedStory('');
                }}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3 font-semibold transition-all duration-300 hover:scale-105"
                data-testid="button-generate-another"
              >
                <Plus className="w-4 h-4 mr-2" />
                Generate Another Story
              </Button>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pro Features */}
            <ProFeatures />

            {/* Recent Stories */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <h3 className="font-magical text-xl text-purple-800 mb-4">📚 Recent Tales</h3>
              
              {stories.length > 0 ? (
                <div className="space-y-4">
                  {stories.slice(0, 3).map((story) => (
                    <div 
                      key={story.id}
                      className={`border-l-4 pl-4 py-2 rounded-r-lg transition-colors cursor-pointer ${getCharacterBorderColor(story.character)} ${getCharacterBgColor(story.character)}`}
                      data-testid={`story-${story.id}`}
                    >
                      <h4 className="font-semibold text-sm text-gray-800 truncate">
                        {story.inputText.slice(0, 40)}...
                      </h4>
                      <p className="text-xs text-gray-600">
                        with {CHARACTERS.find(c => c.id === story.character)?.emoji} {CHARACTERS.find(c => c.id === story.character)?.name} • {story.createdAt ? new Date(story.createdAt).toLocaleDateString() : 'Recent'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-3xl mb-2">📝</div>
                  <p className="text-sm">No stories yet. Create your first magical tale!</p>
                </div>
              )}
              
              {stories.length > 3 && (
                <Button 
                  variant="ghost"
                  className="w-full mt-4 text-purple-600 hover:text-purple-700 text-sm font-medium"
                  data-testid="button-view-all-stories"
                >
                  View All Stories →
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
