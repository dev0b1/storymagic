'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BookOpen, LogOut, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '@/lib/api-client';
import { AuthGuard } from '@/components/auth-guard';

// Chat components
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatInput } from '@/components/chat/ChatInput';
import { UserMessage } from '@/components/chat/UserMessage';
import { SystemMessage } from '@/components/chat/SystemMessage';
import { RecentStoriesModal } from '@/components/chat/RecentStoriesModal';
import { SettingsModal } from '@/components/chat/SettingsModal';

// Chat message type
interface ChatMessage {
  id: string;
  type: 'user' | 'system';
  content: string;
  timestamp: Date;
  storyId?: string;
  narrationMode?: string;
  audioUrl?: string;
  userId?: string;
  savedAudioProvider?: string;
  contentType?: string;
  source?: string;
  isPdf?: boolean;
  isGenerating?: boolean;
  isError?: boolean;
}

import { NARRATION_MODES } from '@/components/narration-mode-card';

export default function DashboardPage() {
  const router = useRouter();
  const { user, demoUser, loading, signOut, setDemoUser } = useAuth();
  const [inputText, setInputText] = useState('');
  const [selectedNarrationMode, setSelectedNarrationMode] = useState<'focus' | 'engaging' | 'doc_theatre'>('engaging');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [showRecentModal, setShowRecentModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();


  const handleSignOut = async () => {
    try {
      await signOut();
      setDemoUser(null);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Create API client with current user
  const apiClient = createApiClient({ user, demoUser });
  
  // Fetch user stories
  const { data: userStories, isLoading: storiesLoading } = useQuery({
    queryKey: ['stories', user?.id || demoUser],
    queryFn: async () => {
      if (!user && !demoUser) return [];
      return apiClient.get('/api/stories');
    },
    enabled: !!(user || demoUser)
  });

  // Story generation mutation
  const storyMutation = useMutation({
    mutationFn: async ({ inputText, narrationMode }: { inputText: string; narrationMode: string }) => {
      return apiClient.post('/api/story', { inputText, narrationMode });
    },
    onMutate: ({ inputText }) => {
      // Add user message immediately
      const userMessageId = Date.now().toString();
      const userMessage: ChatMessage = {
        id: userMessageId,
        type: 'user',
        content: inputText,
        timestamp: new Date(),
        narrationMode: selectedNarrationMode
      };
      
      // Add generating system message
      const systemMessageId = (Date.now() + 1).toString();
      const systemMessage: ChatMessage = {
        id: systemMessageId,
        type: 'system',
        content: 'Generating your story...',
        timestamp: new Date(),
        isGenerating: true
      };
      
      setChatMessages(prev => [...prev, userMessage, systemMessage]);
      
      return { userMessageId, systemMessageId };
    },
    onSuccess: (data, variables, context) => {
      if (context) {
        setChatMessages(prev => 
          prev.map(msg => 
            msg.id === context.systemMessageId
              ? {
                  ...msg,
                  content: data.story,
                  storyId: data.storyId,
                  isGenerating: false
                }
              : msg
          )
        );
      }
      
      // Clear input
      setInputText('');
      setAttachedFile(null);
      
      // Refresh stories list
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
    onError: (error, variables, context) => {
      if (context) {
        setChatMessages(prev => 
          prev.map(msg => 
            msg.id === context.systemMessageId
              ? {
                  ...msg,
                  content: `Error: ${error.message}`,
                  isGenerating: false,
                  isError: true
                }
              : msg
          )
        );
      }
      
      // Show toast notification
      toast({
        title: 'Story generation failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleSendMessage = () => {
    if (!inputText.trim() && !attachedFile) return;
    
    const textToProcess = inputText.trim();
    if (textToProcess) {
      storyMutation.mutate({
        inputText: textToProcess,
        narrationMode: selectedNarrationMode
      });
    }
  };

  return (
      <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Chat Header */}
      <ChatHeader
        onSignOut={handleSignOut}
        onUpgrade={() => {}} // TODO: Implement upgrade functionality
        onShowRecent={() => setShowRecentModal(true)}
        onShowSettings={() => setShowSettingsModal(true)}
        isPremium={false} // TODO: Get from user data
        remainingCredits={10} // TODO: Get from user data
        totalGenerated={0} // TODO: Get from user data
      />

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to StoryMagic
            </h2>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              Transform your ideas into captivating stories. Share some text or upload a PDF to get started.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {NARRATION_MODES.map((mode) => (
                <Button
                  key={mode.id}
                  variant={selectedNarrationMode === mode.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedNarrationMode(mode.id)}
                  className="text-sm"
                >
                  {mode.icon} {mode.name}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
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
                  title={message.isGenerating ? 'Generating...' : 'Story Generated'}
                  content={message.content}
                  narrationMode={selectedNarrationMode}
                  storyId={message.storyId}
                  userId={user?.id || demoUser || undefined}
                  timestamp={message.timestamp}
                  isGenerating={message.isGenerating}
                  isError={message.isError}
                />
              )
            ))}
          </div>
        )}
      </div>

      {/* Chat Input */}
      <ChatInput
        inputText={inputText}
        onInputChange={setInputText}
        onSubmit={handleSendMessage}
        onFileUpload={(file: File) => setAttachedFile(file)}
        selectedNarrationMode={selectedNarrationMode}
        onNarrationModeChange={setSelectedNarrationMode}
        isGenerating={storyMutation.isPending}
        maxLength={600}
        maxFileSize="5MB"
        attachedFile={attachedFile}
        onRemoveFile={() => setAttachedFile(null)}
        remainingCredits={10} // TODO: Get from user data
        isPremium={false} // TODO: Get from user data
      />

      {/* Modals */}
      <RecentStoriesModal
        isOpen={showRecentModal}
        onClose={() => setShowRecentModal(false)}
        stories={userStories || []}
        onSelectStory={(story) => {
          // TODO: Load the selected story into the chat
          console.log('Selected story:', story);
        }}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onUpgrade={() => {}} // TODO: Implement upgrade functionality
        userEmail={demoUser || user?.email || 'guest@storymagic.app'}
        isPremium={false} // TODO: Get from user data
        storiesGenerated={0} // TODO: Get from user data
      />
      </div>
  );
}
