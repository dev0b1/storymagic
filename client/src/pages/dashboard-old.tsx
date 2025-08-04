import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MagicSparkles } from '@/components/ui/magic-sparkles';
import { WhimsicalBackground, getStoryTheme } from '@/components/ui/whimsical-backgrounds';
import { CharacterCard, CHARACTERS } from '@/components/character-card';
import { StoryReader } from '@/components/story-reader';
import { StoryLimits } from '@/components/story-limits';
import { authService, type User } from '@/lib/auth';
import { storyService } from '@/lib/openrouter';
import type { Story } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Settings, LogOut, Sparkles, Plus, Upload, FileText, Crown } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [inputText, setInputText] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<'lumi' | 'spark' | 'bella'>('lumi');
  const [generatedStory, setGeneratedStory] = useState('');
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check auth state
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      setLocation('/auth');
      return;
    }
    setUser(currentUser);
  }, [setLocation]);

  // Fetch user details from server
  const { data: serverUser } = useQuery({
    queryKey: ['/api/me'],
    enabled: !!user,
    retry: false,
    queryFn: async () => {
      const response = await fetch('/api/me', {
        headers: { 'x-user-id': user!.id }
      });
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  useEffect(() => {
    if (serverUser) {
      setUserDetails(serverUser);
    }
  }, [serverUser]);

  // Fetch user stories
  const { data: stories = [] } = useQuery<Story[]>({
    queryKey: ['/api/stories'],
    enabled: !!user,
    retry: false,
    queryFn: async () => {
      const response = await fetch('/api/stories', {
        headers: { 'x-user-id': user!.id }
      });
      if (!response.ok) throw new Error('Failed to fetch stories');
      return response.json();
    }
  });

  // Story generation mutation
  const generateStoryMutation = useMutation({
    mutationFn: async (data: { text: string; character: string; userId: string }) => {
      const response = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate story');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedStory(data.story);
      setCurrentStoryId(data.savedStory?.id || null);
      toast({
        title: "Story created! ✨",
        description: "Your magical tale is ready to enjoy"
      });
      // Invalidate queries to refresh
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
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

    if (!user?.id) return;
    
    generateStoryMutation.mutate({
      text: inputText,
      character: selectedCharacter,
      userId: user.id
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-pink-100 to-white relative overflow-hidden">
      <MagicSparkles />
      <WhimsicalBackground 
        storyTheme={generatedStory ? getStoryTheme(generatedStory) : 'default'} 
        isActive={!!generatedStory}
      />
      
      <div className="relative z-10 h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="flex items-center space-x-3">
            <Sparkles className="text-3xl text-purple-600 animate-bounce" />
            <h1 className="font-magical text-4xl text-purple-800" style={{ textShadow: '0 0 10px rgba(147, 51, 234, 0.5)' }}>
              Story Whirl
            </h1>
            {userDetails?.isPremium === "true" && (
              <Badge className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/settings">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/80 hover:bg-white/90"
                data-testid="button-settings"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Button 
              onClick={handleSignOut}
              variant="outline" 
              size="sm" 
              className="bg-white/80 hover:bg-white/90"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Main Content - Side by Side Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side - Input and Controls */}
          <div className="w-1/2 p-6 space-y-6 overflow-y-auto">
            {/* Story Limits */}
            {userDetails && (
              <StoryLimits 
                storiesGenerated={parseInt(userDetails.storiesGenerated || "0")}
                isPremium={userDetails.isPremium === "true"}
                maxStories={2}
              />
            )}

            {/* Input Section */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-purple-800">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Transform Your Text
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Textarea
                    placeholder={`Paste your text, summary, or content here... 
✨ Try pasting:
• A book summary
• A news article 
• A Wikipedia page
• Any text you want transformed!

${userDetails?.isPremium === "true" ? "Premium: Up to 20,000 characters" : "Free: Up to 600 characters"}`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className={`w-full h-32 p-4 border ${inputText.length > (userDetails?.isPremium === "true" ? 20000 : 600) ? 'border-red-400' : 'border-purple-200'} rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300`}
                    data-testid="textarea-input"
                  />
                  <div className={`absolute bottom-2 right-2 text-xs px-2 py-1 rounded-full ${
                    inputText.length > (userDetails?.isPremium === "true" ? 20000 : 600) 
                      ? 'bg-red-100 text-red-700' 
                      : inputText.length > (userDetails?.isPremium === "true" ? 18000 : 500)
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {inputText.length}/{userDetails?.isPremium === "true" ? "20,000" : "600"}
                  </div>
                </div>
                
                {/* Character Selection */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Choose Your Storyteller:</h4>
                  <div className="grid grid-cols-1 gap-3">
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
                  disabled={
                    generateStoryMutation.isPending || 
                    !inputText.trim() || 
                    inputText.length > (userDetails?.isPremium === "true" ? 20000 : 600)
                  }
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 font-semibold transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Story Display */}
          <div className="w-1/2 p-6 overflow-y-auto">
            {generatedStory ? (
              <div className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center text-purple-800">
                      <FileText className="w-5 h-5 mr-2" />
                      Your Magical Story
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StoryReader 
                      story={generatedStory}
                      character={selectedCharacter}
                      storyId={currentStoryId || undefined}
                      userId={user?.id}
                    />
                  </CardContent>
                </Card>

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
              </div>
            ) : (
              <Card className="bg-white/60 backdrop-blur-sm shadow-xl h-full flex items-center justify-center">
                <CardContent className="text-center">
                  <div className="text-6xl mb-4">✨</div>
                  <h3 className="font-magical text-2xl text-purple-800 mb-2">Ready for Magic?</h3>
                  <p className="text-gray-600">Enter your text and choose a storyteller to begin your magical transformation!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Bottom Section - Recent Stories */}
        <div className="p-6 bg-white/10 backdrop-blur-sm border-t border-white/20">
          <h3 className="font-magical text-xl text-purple-800 mb-4">📚 Recent Tales</h3>
          {stories.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {stories.slice(0, 5).map((story) => (
                <Card 
                  key={story.id}
                  className="min-w-64 bg-white/80 backdrop-blur-sm hover:bg-white/90 cursor-pointer transition-all duration-300 hover:scale-105"
                  onClick={() => {
                    setGeneratedStory(story.outputStory);
                    setSelectedCharacter(story.character as 'lumi' | 'spark' | 'bella');
                    setCurrentStoryId(story.id);
                  }}
                >
                  <CardContent className="p-4">
                    <div className={`border-l-4 pl-3 ${getCharacterBorderColor(story.character)}`}>
                      <p className="text-sm font-medium text-gray-800 mb-1">
                        {CHARACTERS.find(c => c.id === story.character)?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {story.inputText.slice(0, 80)}...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">No stories yet. Create your first magical tale!</p>
          )}
        </div>
      </div>
    </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Story Generator */}
          <div className="lg:col-span-2 space-y-6">
            {/* Input Section */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-magical text-xl text-purple-800">✨ Your Text to Transform</h3>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                    <Upload className="w-4 h-4 mr-1" />
                    Upload File
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <Textarea
                  placeholder={`Paste your text, summary, or content here... 
✨ Try pasting:
• A book summary
• A news article 
• A Wikipedia page
• Any text you want transformed!

${userDetails?.isPremium === "true" ? "Premium: Up to 20,000 characters" : "Free: Up to 600 characters"}`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className={`w-full h-40 p-4 border ${inputText.length > (userDetails?.isPremium === "true" ? 20000 : 600) ? 'border-red-400' : 'border-purple-200'} rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300`}
                  data-testid="textarea-input"
                />
                <div className={`absolute bottom-2 right-2 text-xs px-2 py-1 rounded-full ${
                  inputText.length > (userDetails?.isPremium === "true" ? 20000 : 600) 
                    ? 'bg-red-100 text-red-700' 
                    : inputText.length > (userDetails?.isPremium === "true" ? 18000 : 500)
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {inputText.length}/{userDetails?.isPremium === "true" ? "20,000" : "600"}
                </div>
              </div>
              
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
                disabled={
                  generateStoryMutation.isPending || 
                  !inputText.trim() || 
                  inputText.length > (userDetails?.isPremium === "true" ? 20000 : 600)
                }
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
            {generatedStory && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <h3 className="font-magical text-xl text-purple-800 mb-4">✨ Your Magical Story</h3>
                <StoryReader 
                  story={generatedStory}
                  character={selectedCharacter}
                  storyId={currentStoryId || undefined}
                  userId={user?.id}
                />
              </div>
            )}

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
            {/* Story Limits */}
            {userDetails && (
              <StoryLimits 
                storiesGenerated={parseInt(userDetails.storiesGenerated || "0")}
                isPremium={userDetails.isPremium === "true"}
                maxStories={2}
              />
            )}

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
