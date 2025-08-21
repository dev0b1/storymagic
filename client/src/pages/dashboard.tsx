import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MagicSparkles } from '@/components/ui/magic-sparkles';
import { WhimsicalBackground, getStoryTheme } from '@/components/ui/whimsical-backgrounds';

import { NarrationModeCard, NARRATION_MODES } from '@/components/narration-mode-card';
import { StoryReader } from '@/components/story-reader';
import { ProFeatures } from '@/components/pro-features';
import { LogOut, Plus, Sparkles, FileText, Settings, Crown, Volume2, Download, Star } from 'lucide-react';
import { authService, type User } from '@/lib/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { storyService } from '@/lib/openrouter';
import type { Story } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

import { Link, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { safeNavigate } from '@/lib/navigation';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [inputText, setInputText] = useState('');
  const [generatedStory, setGeneratedStory] = useState('');
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  const [selectedNarrationMode, setSelectedNarrationMode] = useState<'focus' | 'balanced' | 'engaging' | 'doc_theatre'>('balanced');
  const [isStoryPlaying, setIsStoryPlaying] = useState(false);
  const [storyContentType, setStoryContentType] = useState<string>('general');
  const [storySource, setStorySource] = useState<string>('text');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showProFeatures, setShowProFeatures] = useState(false);

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      console.log('Checking auth state...');
      try {
        const currentUser = await authService.getCurrentUser();
        console.log('Current user from auth service:', currentUser);
        
        if (!currentUser) {
          console.log('No user found, redirecting to auth...');
          safeNavigate(setLocation, '/auth');
          return;
        }
        
        console.log('User found, setting user state:', currentUser);
        setUser(currentUser);
      } catch (error) {
        console.error('Auth check failed:', error);
        safeNavigate(setLocation, '/auth');
      }
    };

    checkAuth();
  }, [setLocation]);

  // Fetch user details
  const { data: userDetails } = useQuery<User>({
    queryKey: ['/api/me'],
    enabled: !!user,
    retry: false,
    staleTime: 0,
    queryFn: async () => {
      const response = await fetch('/api/me', {
        headers: { 'x-user-id': user!.id }
      });
      if (!response.ok) throw new Error('Failed to fetch user details');
      const userData = await response.json();
      
      // Update local storage with fresh user data (best-effort)
      try {
        await authService.updateLocalUser(userData);
      } catch (e) {
        console.warn('Failed to update local user with fresh data:', e);
      }
      
      return userData;
    }
  });

  // Fetch user stories
  const { data: stories = [], refetch: refetchStories } = useQuery<Story[]>({
    queryKey: ['/api/stories'],
    enabled: !!user,
    retry: false,
    staleTime: 0, // Always refetch to get latest stories
    queryFn: async () => {
      const headers: Record<string, string> = { 'x-user-id': user!.id };
      if (localStorage.getItem('demo_user') === 'true') {
        headers['x-demo-user'] = 'true';
      } else if (isSupabaseConfigured) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
          if (session.refresh_token) headers['x-refresh-token'] = session.refresh_token;
        }
      }
      const response = await fetch('/api/stories', { headers });
      if (!response.ok) throw new Error('Failed to fetch stories');
      const storiesData = await response.json();
      
      // Update stories state if we have new data
      if (storiesData.length > 0 && !generatedStory) {
        const latestStory = storiesData[0];
        setGeneratedStory(latestStory.output_story);
        setCurrentStoryId(latestStory.id);
        setSelectedNarrationMode(latestStory.narration_mode as 'focus' | 'balanced' | 'engaging');
        setStoryContentType(latestStory.content_type || 'general');
        setStorySource(latestStory.source || 'text');
      }
      
      return storiesData;
    }
  });

  // Story generation mutation
  const generateStoryMutation = useMutation({
    mutationFn: async (data: { text: string; narrationMode: string; userId: string }) => {
      // Check if content looks like PDF content (has PDF markers or is very long)
      const isPDFContent = data.text.includes('[PDF Content]') || 
                          data.text.length > 1000 || 
                          data.text.includes('Page') ||
                          data.text.includes('Chapter');
      
      const endpoint = isPDFContent ? '/api/pdf-to-story' : '/api/story';
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-id': data.userId
      };
      if (localStorage.getItem('demo_user') === 'true') {
        headers['x-demo-user'] = 'true';
      } else if (isSupabaseConfigured) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
          if (session.refresh_token) headers['x-refresh-token'] = session.refresh_token;
        }
      }
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          inputText: data.text,
          narrationMode: data.narrationMode,
          ...(isPDFContent && { pdfText: data.text })
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to generate story');
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log('Story generation response:', data); // Debug log
      setGeneratedStory(data.story);
      setCurrentStoryId(data.storyId || data.id); // Try both possible ID fields
      setIsStoryPlaying(false); // Reset playing state when new story is generated
      
      // Set content type and source for display
      setStoryContentType(data.contentType || 'general');
      setStorySource(data.source || 'text');
      
      // Refetch stories to update the list
        refetchStories();
      
      const contentType = data.contentType || 'general';
      const source = data.source || 'text';
      
      toast({
        title: "Story Generated! ✨",
        description: `Your ${data.narrationMode} ${source === 'pdf' ? 'PDF story' : 'story'} is ready (${contentType} mode).`,
      });
    },
    onError: (error) => {
      console.error('Story generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleGenerateStory = () => {
    if (!user) return;
    
    generateStoryMutation.mutate({
      text: inputText,
      narrationMode: selectedNarrationMode,
      userId: user.id
    });
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
  safeNavigate(setLocation, '/auth');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getNarrationModeBorderColor = (storyMode: string) => {
    switch (storyMode) {
      case 'focus': return 'border-l-blue-400';
      case 'balanced': return 'border-l-purple-400';
      case 'engaging': return 'border-l-green-400';
      default: return 'border-l-gray-400';
    }
  };

  // Handle story playing state changes
  const handleStoryPlayingChange = (playing: boolean) => {
    setIsStoryPlaying(playing);
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
        {/* Header - Compact */}
        <div className="flex justify-between items-center px-6 py-3 bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="flex items-center space-x-3">
            <Sparkles className="text-xl text-purple-600" />
            <h1 className="font-magical text-2xl text-purple-800">Story Whirl</h1>
            {userDetails?.is_premium && (
              <Badge className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white text-xs">
                <Crown className="w-3 h-3 mr-1" />
                Pro
              </Badge>
            )}
            {/* Story Counter in Header */}
            <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-2 py-1">
              <FileText className="h-3 w-3 text-purple-700" />
              <span className="text-xs font-medium text-purple-700">
                {userDetails?.stories_generated || 0}{!userDetails?.is_premium && "/2"}
              </span>
              {!userDetails?.is_premium && (
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-2 h-6 px-2 text-xs"
                  onClick={async () => {
                    try {
                      const headers: Record<string, string> = {};
                      if (localStorage.getItem('demo_user') === 'true') headers['x-user-id'] = 'demo@gmail.com';
                      const res = await fetch('/api/upgrade', { method: 'POST', headers });
                      if (!res.ok) throw new Error('Upgrade failed');
                      await queryClient.invalidateQueries({ queryKey: ['/api/me'] });
                    } catch (e) {
                      console.error('Upgrade error:', e);
                    }
                  }}
                >
                  <Star className="w-3 h-3 mr-1" />
                  Upgrade
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="text-xs px-2 py-1 text-purple-700 hover:bg-white/20">
                <Settings className="w-3 h-3 mr-1" />
                Settings
              </Button>
            </Link>
            <Button 
              onClick={handleSignOut}
              variant="ghost" 
              size="sm" 
              className="text-xs px-2 py-1 text-purple-700 hover:bg-white/20"
            >
              <LogOut className="w-3 h-3 mr-1" />
              Logout
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* Left Side - Input and History */}
            <div className="w-1/2 p-6 space-y-6 overflow-y-auto">



            {/* Input Section */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center text-purple-800">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Transform Your Text
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Paste your text, summary, or content here... 
✨ Try pasting:
• A book summary
• A news article 
• A Wikipedia page
• Any text you want transformed!
• Or upload a PDF above!

${userDetails?.is_premium ? "Premium: Up to 20,000 characters" : "Free: Up to 600 characters"}`}
                    className="w-full h-32 p-4 border border-purple-200 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    disabled={generateStoryMutation.isPending}
                    data-testid="textarea-input"
                  />
                  <div className={`absolute bottom-2 right-2 text-xs px-2 py-1 rounded-full ${
                    inputText.length > (userDetails?.is_premium ? 20000 : 600) 
                      ? 'bg-red-100 text-red-700' 
                      : inputText.length > (userDetails?.is_premium ? 18000 : 500)
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {inputText.length}/{userDetails?.is_premium ? "20,000" : "600"}
                  </div>
                </div>
                
                {/* PDF Upload Button */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('pdf-upload')?.click()}
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                    disabled={generateStoryMutation.isPending}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Upload PDF
                  </Button>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Check file size limits
                        const maxSize = userDetails?.is_premium ? 20 * 1024 * 1024 : 5 * 1024 * 1024; // 20MB for premium, 5MB for free
                        if (file.size > maxSize) {
                          toast({
                            title: "File too large",
                            description: `Maximum file size is ${userDetails?.is_premium ? '20MB' : '5MB'} for ${userDetails?.is_premium ? 'premium' : 'free'} users.`,
                            variant: "destructive",
                          });
                          return;
                        }

                        // Create FormData for file upload
                        const formData = new FormData();
                        formData.append('pdf', file);
                        formData.append('narrationMode', selectedNarrationMode);

                        try {
                          const headers: Record<string, string> = { 'x-user-id': user?.id || 'demo' };
                          if (localStorage.getItem('demo_user') === 'true') {
                            headers['x-demo-user'] = 'true';
                          } else if (isSupabaseConfigured) {
                            const { data: { session } } = await supabase.auth.getSession();
                            if (session?.access_token) {
                              headers['Authorization'] = `Bearer ${session.access_token}`;
                              if (session.refresh_token) headers['x-refresh-token'] = session.refresh_token;
                            }
                          }
                          const response = await fetch('/api/upload-pdf', {
                            method: 'POST',
                            headers,
                            body: formData
                          });

                          if (!response.ok) {
                            const error = await response.json();
                            throw new Error(error.message || 'Failed to process PDF');
                          }

                          const result = await response.json();
                          
                          // Update state with generated story
                          setGeneratedStory(result.story);
                          setCurrentStoryId(result.storyId);
                          setStoryContentType(result.contentType || 'general');
                          setStorySource('pdf');
                          setIsStoryPlaying(false);

                          toast({
                            title: "PDF processed successfully!",
                            description: `Extracted ${result.extractedTextLength} characters and generated your story.`,
                          });
                        } catch (error) {
                          console.error('PDF processing error:', error);
                          toast({
                            title: "PDF processing failed",
                            description: error instanceof Error ? error.message : "Please try uploading a different PDF or paste text manually.",
                            variant: "destructive",
                          });
                        }
                      }
                    }}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <span className="text-xs text-gray-500">
                    {userDetails?.is_premium ? "Premium: Up to 20MB" : "Free: Up to 5MB"}
                  </span>
                </div>
                
                {/* Narration Mode Selection */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Choose Narration Mode:</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {NARRATION_MODES.map((mode) => (
                      <NarrationModeCard
                        key={mode.id}
                        mode={mode}
                        selected={selectedNarrationMode === mode.id}
                        onSelect={setSelectedNarrationMode}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Stories Remaining and Generate Button */}
                <div className="space-y-3">
                  {userDetails && !userDetails.is_premium && (
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <span className="text-sm text-purple-700">
                        Stories remaining: <strong>{Math.max(0, 2 - (userDetails.stories_generated || 0))}</strong> of 2
                      </span>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <Crown className="w-3 h-3 mr-1" />
                        Upgrade Pro
                      </Button>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleGenerateStory}
                    disabled={
                      generateStoryMutation.isPending || 
                      !inputText.trim() || 
                      inputText.length > (userDetails?.is_premium ? 20000 : 600) ||
                      (userDetails && !userDetails.is_premium && (userDetails.stories_generated || 0) >= 2)
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
                        Generate Story
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Stories Section */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-purple-800">
                  <FileText className="w-5 h-5 mr-2" />
                  Latest Stories
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stories.length > 0 ? (
                  <div className="grid gap-3">
                    {stories.slice(0, 3).map((story) => (
                      <div
                        key={story.id}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                        onClick={() => {
                          setGeneratedStory(story.output_story);
                          setSelectedNarrationMode(story.narration_mode as 'focus' | 'balanced' | 'engaging');
                          setCurrentStoryId(story.id);
                          setIsStoryPlaying(false); // Reset playing state when selecting a story
                          setStoryContentType(story.content_type || 'general'); // Use story's content type
                          setStorySource(story.source || 'text'); // Use story's source
                        }}
                      >
                        <div className={`border-l-4 pl-3 ${getNarrationModeBorderColor(story.narration_mode)}`}>
                          <p className="text-sm font-medium text-gray-800 mb-1">
                            {NARRATION_MODES.find(m => m.id === story.narration_mode)?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {story.input_text.slice(0, 100)}...
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No stories yet! Generate your first magical tale above.</p>
                )}
              </CardContent>
            </Card>

            </div>

            {/* Right Side - Story Display */}
            <div className="w-1/2 p-6 overflow-y-auto">
              {generatedStory ? (
                <Card className="bg-white">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-purple-800">
                      <Sparkles className="w-5 h-5 mr-2" />
                        Your Story
                    </CardTitle>
                      <div className="flex items-center gap-2">
                        {storySource === 'pdf' && (
                          <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                            PDF Source
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-purple-200 text-purple-700 hover:bg-purple-50"
                          onClick={() => window.dispatchEvent(new Event('storymagic:generate-audio'))}
                          data-testid="header-generate-audio"
                        >
                          <Volume2 className="w-4 h-4 mr-2" />
                          Generate Audio
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-200 text-gray-700 hover:bg-gray-50"
                          onClick={() => window.dispatchEvent(new Event('storymagic:download-audio'))}
                          data-testid="header-download-audio"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <StoryReader 
                      story={generatedStory}
                      narrationMode={selectedNarrationMode}
                      storyId={currentStoryId || undefined}
                      userId={user?.id}
                      usedFallback={false}
                      onPlayingChange={handleStoryPlayingChange}
                      isGenerating={generateStoryMutation.isPending}
                      contentType={storyContentType}
                      source={storySource}
                    />
                    
                    <Button
                      onClick={() => {
                        setInputText('');
                        setGeneratedStory('');
                        setCurrentStoryId(null);
                        setIsStoryPlaying(false);
                        setStoryContentType('general');
                        setStorySource('text');
                      }}
                      className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3 font-semibold transition-all duration-300 hover:scale-105"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Generate Another Story
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white h-full flex items-center justify-center">
                  <CardContent className="text-center">
                    <div className="text-6xl mb-4">✨</div>
                    <h3 className="font-magical text-2xl text-purple-800 mb-2">Ready for Magic?</h3>
                    <p className="text-gray-600">Enter your text and choose a storyteller to begin your magical transformation!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* ProFeatures Modal */}
      {showProFeatures && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Premium Features</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProFeatures(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
              <ProFeatures 
                onUpgrade={async () => {
                  try {
                    const headers: Record<string, string> = {};
                    if (localStorage.getItem('demo_user') === 'true') headers['x-user-id'] = 'demo@gmail.com';
                    const res = await fetch('/api/upgrade', { method: 'POST', headers });
                    if (!res.ok) throw new Error('Upgrade failed');
                    await queryClient.invalidateQueries({ queryKey: ['/api/me'] });
                    setShowProFeatures(false);
                  } catch (e) {
                    console.error('Upgrade error:', e);
                  }
                }}
                currentPlan={userDetails?.is_premium ? 'premium' : 'free'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}