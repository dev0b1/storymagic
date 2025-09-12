'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BookOpen, LogOut, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '@/lib/api-client';

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
  const { user, loading, signOut } = useAuth();
  const [inputText, setInputText] = useState('');
  const [selectedNarrationMode, setSelectedNarrationMode] = useState<'focus' | 'engaging' | 'doc_theatre'>('engaging');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [showRecentModal, setShowRecentModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();


  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Create API client with current user
  const apiClient = createApiClient({ user });
  
  // Fetch user stories
  const { data: userStories, isLoading: storiesLoading, error: storiesError } = useQuery({
    queryKey: ['stories', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return apiClient.get('/api/stories');
    },
    enabled: !!user
  });

  // Handle stories error
  useEffect(() => {
    if (storiesError) {
      console.error('Failed to fetch stories:', storiesError);
      setDatabaseError(storiesError.message || 'Failed to load stories');
    }
  }, [storiesError]);

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
      
      // Check if it's a database error
      if (error.message.includes('Database') || error.message.includes('connection')) {
        setDatabaseError(error.message);
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
      {/* Database Error Notification */}
      {databaseError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Database Connection Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{databaseError}</p>
                <p className="mt-1">Please check your database configuration and try again.</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setDatabaseError(null)}
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  userId={user?.id || undefined}
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
        stories={Array.isArray(userStories) ? userStories : []}
        onSelectStory={(story) => {
          // TODO: Load the selected story into the chat
          console.log('Selected story:', story);
        }}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onUpgrade={() => {}} // TODO: Implement upgrade functionality
        userEmail={user?.email}
        isPremium={false} // TODO: Get from user data
        storiesGenerated={0} // TODO: Get from user data
      />
      </div>
  );
}
