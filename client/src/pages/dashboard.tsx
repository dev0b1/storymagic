import { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { authService, type User } from '@/lib/auth';
import type { Story } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { lemonSqueezyService } from '@/lib/lemonsqueezy';

import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { safeNavigate } from '@/lib/navigation';

// Chat components
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatInput } from '@/components/chat/ChatInput';
import { UserMessage } from '@/components/chat/UserMessage';
import { SystemMessage } from '@/components/chat/SystemMessage';
import { RecentStoriesModal } from '@/components/chat/RecentStoriesModal';
import { SettingsModal } from '@/components/chat/SettingsModal';
import { ProFeatures } from '@/components/pro-features';
import { NARRATION_MODES } from '@/components/narration-mode-card';

// Chat message type
interface ChatMessage {
  id: string;
  type: 'user' | 'system';
  content: string;
  timestamp: Date;
  storyId?: string;
  narrationMode?: string;
  audioUrl?: string;
  contentType?: string;
  source?: string;
  isPdf?: boolean;
  isGenerating?: boolean;
  isError?: boolean;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [inputText, setInputText] = useState('');
  const [selectedNarrationMode, setSelectedNarrationMode] = useState<'focus' | 'engaging' | 'doc_theatre'>('engaging'); // Default to Narration
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [showRecentModal, setShowRecentModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProFeatures, setShowProFeatures] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper to init Lemon Squeezy checkout flow
  const initLemonSqueezyCheckout = async () => {
    try {
      const current = await authService.getCurrentUser();
      const email = current?.email || localStorage.getItem('userEmail') || 'demo@promptbook.app';
      const userId = current?.id || 'demo';
      
      const { checkoutUrl } = await lemonSqueezyService.createCheckout(email, userId);
      lemonSqueezyService.redirectToCheckout(checkoutUrl);
    } catch (e) {
      console.error('Lemon Squeezy checkout failed:', e);
      toast({ 
        title: 'Payment failed', 
        description: 'Could not start checkout. Please try again later.',
        variant: 'destructive'
      });
    }
  };

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
    staleTime: 0,
    queryFn: async () => {
      const headers: Record<string, string> = { 'x-user-id': user!.id };
      if (localStorage.getItem('demo_user') === 'true') {
        headers['x-demo-user'] = 'true';
      } else if ((await import('@/lib/supabase')).isSupabaseConfigured) {
        const { supabase } = await import('@/lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
          if (session.refresh_token) headers['x-refresh-token'] = session.refresh_token;
        }
      }
      const response = await fetch('/api/stories', { headers });
      if (!response.ok) throw new Error('Failed to fetch stories');
      return response.json();
    }
  });

  // Convert stories to chat messages when they load
  useEffect(() => {
    if (stories.length > 0 && chatMessages.length === 0) {
      const messages: ChatMessage[] = [];
      stories.forEach(story => {
        // Add user message
        messages.push({
          id: `user-${story.id}`,
          type: 'user',
          content: story.input_text,
          timestamp: new Date(story.created_at),
          isPdf: story.source === 'pdf'
        });
        
        // Add system response
        messages.push({
          id: `system-${story.id}`,
          type: 'system',
          content: story.output_story,
          timestamp: new Date(story.created_at),
          storyId: story.id,
          narrationMode: story.narration_mode,
          contentType: story.content_type || 'general',
          source: story.source || 'text'
        });
      });
      setChatMessages(messages.reverse()); // Show newest first
    }
  }, [stories, chatMessages.length]);

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
      } else if ((await import('@/lib/supabase')).isSupabaseConfigured) {
        const { supabase } = await import('@/lib/supabase');
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
      console.log('Story generation success data:', data);
      
      // Replace generating message with actual result
      const systemMessage: ChatMessage = {
        id: `system-${data.storyId || Date.now()}`,
        type: 'system',
        content: data.story,
        timestamp: new Date(),
        storyId: data.storyId || data.id,
        narrationMode: selectedNarrationMode,
        contentType: data.contentType || 'general',
        source: data.source || 'text',
        audioUrl: data.audioUrl // Add audio URL if available
      };
      
      // Replace the generating message
      setChatMessages(prev => {
        console.log('Current messages before update:', prev);
        const updated = prev.map(msg => {
          if (msg.isGenerating) {
            console.log('Replacing generating message:', msg.id, 'with:', systemMessage.id);
            return systemMessage;
          }
          return msg;
        });
        console.log('Updated messages:', updated);
        return updated;
      });
      
      setInputText(''); // Clear input
      setAttachedFile(null); // Clear attached file
      refetchStories();
      
      toast({
        title: 'Audio Content Created! ✨',
        description: `Your ${NARRATION_MODES.find(m => m.id === selectedNarrationMode)?.name.toLowerCase()} audio is ready.`,
      });
    },
    onError: (error) => {
      console.error('Story generation error:', error);
      
      // Replace generating message with error
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'system',
        content: (error as Error).message || 'Something went wrong. Please try again.',
        timestamp: new Date(),
        narrationMode: selectedNarrationMode,
        isError: true
      };
      
      setChatMessages(prev => {
        console.log('Replacing generating message with error');
        return prev.map(msg => msg.isGenerating ? errorMessage : msg);
      });
      
      toast({
        title: 'Generation Failed',
        description: (error as Error).message || 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    }
  });

  
  const handleFileUpload = (file: File) => {
    if (!user) return;
    
    const maxSize = userDetails?.is_premium ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: `Maximum file size is ${userDetails?.is_premium ? '20MB' : '5MB'}.`,
        variant: 'destructive',
      });
      return;
    }
    
    setAttachedFile(file);
    
    toast({
      title: 'PDF attached',
      description: `${file.name} is ready for processing.`,
    });
  };
  
  const handleRemoveFile = () => {
    setAttachedFile(null);
  };
  
  const handleSubmit = async () => {
    if (!user) return;
    
    const hasContent = inputText.trim() || attachedFile;
    if (!hasContent) return;
    
    // Add user message(s) to chat
    const messages: ChatMessage[] = [];
    
    if (attachedFile) {
      messages.push({
        id: `user-${Date.now()}`,
        type: 'user',
        content: `📄 ${attachedFile.name}${inputText ? `\n\n${inputText}` : ''}`,
        timestamp: new Date(),
        isPdf: true
      });
    } else {
      messages.push({
        id: `user-${Date.now()}`,
        type: 'user',
        content: inputText,
        timestamp: new Date()
      });
    }
    
    // Add generating system message
    const generatingMessage: ChatMessage = {
      id: `generating-${Date.now()}`,
      type: 'system',
      content: attachedFile 
        ? `Processing your PDF${inputText ? ' with instructions' : ''} and generating audio content...`
        : 'Generating your audio content...',
      timestamp: new Date(),
      narrationMode: selectedNarrationMode,
      isGenerating: true
    };
    
    setChatMessages(prev => [...prev, ...messages, generatingMessage]);
    
    try {
      if (attachedFile) {
        // Handle PDF upload
        const formData = new FormData();
        formData.append('pdf', attachedFile);
        formData.append('narrationMode', selectedNarrationMode);
        if (inputText) {
          formData.append('instructions', inputText);
        }
        
        const headers: Record<string, string> = { 'x-user-id': user.id };
        if (localStorage.getItem('demo_user') === 'true') {
          headers['x-demo-user'] = 'true';
        } else if ((await import('@/lib/supabase')).isSupabaseConfigured) {
          const { supabase } = await import('@/lib/supabase');
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
        
        // Replace generating message with actual result
        const systemMessage: ChatMessage = {
          id: `system-${result.storyId}`,
          type: 'system',
          content: result.story,
          timestamp: new Date(),
          storyId: result.storyId,
          narrationMode: selectedNarrationMode,
          contentType: result.contentType || 'general',
          source: 'pdf'
        };
        
        setChatMessages(prev => prev.map(msg => 
          msg.id === generatingMessage.id ? systemMessage : msg
        ));
        
        setInputText('');
        setAttachedFile(null);
        refetchStories();
        
        toast({
          title: 'PDF processed successfully!',
          description: `Generated your audio from ${result.extractedTextLength} characters.`,
        });
      } else {
        // Handle text generation
        generateStoryMutation.mutate({
          text: inputText,
          narrationMode: selectedNarrationMode,
          userId: user.id
        });
      }
    } catch (error) {
      // Replace generating message with error
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'system',
        content: error instanceof Error ? error.message : 'Processing failed. Please try again.',
        timestamp: new Date(),
        narrationMode: selectedNarrationMode,
        isError: true
      };
      
      setChatMessages(prev => prev.map(msg => 
        msg.id === generatingMessage.id ? errorMessage : msg
      ));
      
      toast({
        title: attachedFile ? 'PDF processing failed' : 'Generation failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleSelectStory = (story: Story) => {
    // Find existing messages for this story or add them
    const hasStory = chatMessages.some(msg => msg.storyId === story.id);
    if (!hasStory) {
      const userMessage: ChatMessage = {
        id: `user-${story.id}`,
        type: 'user',
        content: story.input_text,
        timestamp: new Date(story.created_at),
        isPdf: story.source === 'pdf'
      };
      
      const systemMessage: ChatMessage = {
        id: `system-${story.id}`,
        type: 'system',
        content: story.output_story,
        timestamp: new Date(story.created_at),
        storyId: story.id,
        narrationMode: story.narration_mode,
        contentType: story.content_type || 'general',
        source: story.source || 'text'
      };
      
      setChatMessages(prev => [...prev, userMessage, systemMessage]);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('Starting sign out process...');
      
      // Clear user state immediately to prevent UI issues
      setUser(null);
      
      // Clear any cached data
      queryClient.clear();
      
      // Call auth service to sign out
      await authService.signOut();
      
      // Force navigate to auth page
      console.log('Navigating to auth page...');
      window.location.href = '/auth';
    } catch (error) {
      console.error('Sign out error:', error);
      // Force redirect even if there's an error
      window.location.href = '/auth';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const remainingCredits = userDetails?.is_premium 
    ? undefined 
    : Math.max(0, 10 - (userDetails?.stories_generated || 0));

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <ChatHeader
        onSignOut={handleSignOut}
        onUpgrade={initLemonSqueezyCheckout}
        onShowRecent={() => setShowRecentModal(true)}
        onShowSettings={() => setShowSettingsModal(true)}
        isPremium={!!userDetails?.is_premium}
        remainingCredits={remainingCredits}
        totalGenerated={userDetails?.stories_generated || 0}
      />

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {chatMessages.length === 0 ? (
            <div className="text-center py-8 mb-4">
              <p className="text-gray-600 text-sm">
                Welcome! Create audio from text or PDFs below.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {chatMessages.map((message) => (
                message.type === 'user' ? (
                  <UserMessage
                    key={message.id}
                    content={message.content}
                    isPdf={message.isPdf}
                    timestamp={message.timestamp}
                  />
                ) : (
                  <SystemMessage
                    key={message.id}
                    title={`${message.narrationMode?.charAt(0).toUpperCase()}${message.narrationMode?.slice(1)} Audio Content`}
                    content={message.content}
                    narrationMode={message.narrationMode || 'focus'}
                    audioUrl={message.audioUrl}
                    storyId={message.storyId}
                    timestamp={message.timestamp}
                    contentType={message.contentType}
                    source={message.source}
                    isGenerating={message.isGenerating}
                    isError={message.isError}
                  />
                )
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Input */}
      <ChatInput
        inputText={inputText}
        onInputChange={setInputText}
        onSubmit={handleSubmit}
        onFileUpload={handleFileUpload}
        selectedNarrationMode={selectedNarrationMode}
        onNarrationModeChange={setSelectedNarrationMode}
        isGenerating={generateStoryMutation.isPending}
        maxLength={userDetails?.is_premium ? 20000 : 600}
        maxFileSize={userDetails?.is_premium ? '20MB' : '5MB'}
        remainingCredits={remainingCredits}
        isPremium={!!userDetails?.is_premium}
        attachedFile={attachedFile}
        onRemoveFile={handleRemoveFile}
      />

      {/* Recent Stories Modal */}
      <RecentStoriesModal
        isOpen={showRecentModal}
        onClose={() => setShowRecentModal(false)}
        stories={stories}
        onSelectStory={handleSelectStory}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onUpgrade={initLemonSqueezyCheckout}
        userEmail={user?.email || 'demo@gmail.com'}
        isPremium={!!userDetails?.is_premium}
        storiesGenerated={userDetails?.stories_generated || 0}
      />

      {/* ProFeatures Modal */}
      {showProFeatures && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Premium Features</h2>
                <button
                  onClick={() => setShowProFeatures(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>
              <ProFeatures 
                onUpgrade={initLemonSqueezyCheckout}
                currentPlan={userDetails?.is_premium ? 'premium' : 'free'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}