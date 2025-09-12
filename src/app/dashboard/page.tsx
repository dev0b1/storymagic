'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Upload, BookOpen, FileText, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '@/lib/api-client';

// StudyFlow components
import { PDFUpload } from '@/components/pdf/PDFUpload';
import { FlashcardDeck } from '@/components/flashcard/FlashcardDeck';
import { RecentDocumentsModal } from '@/components/documents/RecentDocumentsModal';
import { SettingsModal } from '@/components/settings/SettingsModal';

// Types
interface Document {
  id: string;
  title: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  content_type: string;
  extracted_text?: string;
  summary?: string;
  processing_status: string;
  created_at: string;
  updated_at: string;
}

interface Flashcard {
  id: string;
  document_id: string;
  user_id: string;
  front: string;
  back: string;
  hint?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showRecentModal, setShowRecentModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
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
  
  // Fetch user documents
  const { data: userDocuments, isLoading: documentsLoading, error: documentsError } = useQuery({
    queryKey: ['documents', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return apiClient.get('/api/documents');
    },
    enabled: !!user
  });

  // Fetch flashcards for selected document
  const { data: flashcards, isLoading: flashcardsLoading, error: flashcardsError } = useQuery({
    queryKey: ['flashcards', selectedDocument?.id],
    queryFn: async () => {
      if (!selectedDocument || !user) return [];
      return apiClient.get(`/api/flashcards?documentId=${selectedDocument.id}`);
    },
    enabled: !!selectedDocument && !!user
  });

  // Handle documents error
  useEffect(() => {
    if (documentsError) {
      console.error('Failed to fetch documents:', documentsError);
      setDatabaseError(documentsError.message || 'Failed to load documents');
    }
  }, [documentsError]);

  // PDF upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace('.pdf', ''));
      
      return apiClient.post('/api/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onMutate: () => {
      setIsUploading(true);
      setUploadProgress(0);
    },
    onSuccess: (data) => {
      setIsUploading(false);
      setUploadProgress(100);
      
      // Refresh documents list
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      
      // Show success message
      toast({
        title: 'PDF uploaded successfully',
        description: 'Your document is being processed. Flashcards will be ready soon!',
      });
      
      // Switch to study tab if flashcards are available
      setTimeout(() => {
        setActiveTab('study');
        if (data.document) {
          setSelectedDocument(data.document);
        }
      }, 2000);
    },
    onError: (error) => {
      setIsUploading(false);
      setUploadProgress(0);
      
      // Check if it's a database error
      if (error.message.includes('Database') || error.message.includes('connection')) {
        setDatabaseError(error.message);
      }
      
      // Show toast notification
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleFileUpload = async (file: File) => {
    uploadMutation.mutate(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  StudyFlow
                </h1>
                <p className="text-sm text-gray-500">AI-Powered Study Assistant</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setShowRecentModal(true)}
                className="text-gray-600 hover:text-gray-900"
              >
                <FileText className="w-4 h-4 mr-2" />
                Documents
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowSettingsModal(true)}
                className="text-gray-600 hover:text-gray-900"
              >
                Settings
              </Button>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload PDF
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="study" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Study
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Upload Your PDF Document
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Upload a PDF document and let our AI extract key concepts to create interactive flashcards for efficient studying.
              </p>
            </div>
            <PDFUpload
              onFileUpload={handleFileUpload}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
            />
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Document Summary
            </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Get AI-powered summaries of your uploaded documents. Perfect for quick reviews and understanding main concepts.
              </p>
            </div>
            
            {selectedDocument ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {selectedDocument.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Processing Status:</span>
                        <Badge 
                          variant={selectedDocument.processing_status === 'completed' ? 'default' : 'secondary'}
                          className={selectedDocument.processing_status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                        >
                          {selectedDocument.processing_status}
                        </Badge>
                      </div>
                      
                      {selectedDocument.summary ? (
                        <div className="mt-6">
                          <h3 className="text-lg font-semibold mb-4 text-gray-900">AI Summary</h3>
                          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-6 border border-amber-100">
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {selectedDocument.summary}
                            </p>
                          </div>
                        </div>
                      ) : selectedDocument.processing_status === 'completed' ? (
                        <div className="text-center py-8">
                          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Summary Available</h3>
                          <p className="text-gray-500">
                            This document was processed but no summary was generated. Try uploading another document.
                          </p>
          </div>
        ) : (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
                          <h3 className="text-lg font-semibold text-gray-600 mb-2">Generating Summary...</h3>
                          <p className="text-gray-500">
                            Our AI is analyzing your document and creating a comprehensive summary.
                          </p>
          </div>
        )}
      </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Document Selected</h3>
                  <p className="text-gray-500 text-center mb-4">
                    Upload a PDF document first to view its AI-generated summary.
                  </p>
                  <Button
                    onClick={() => setActiveTab('upload')}
                  >
                    Upload Document
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="study" className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Study with Flashcards
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Practice with AI-generated flashcards from your uploaded documents. Use hints and track your progress.
              </p>
            </div>
            
            {selectedDocument ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {selectedDocument.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Status: {selectedDocument.processing_status}
                    </p>
                  </CardContent>
                </Card>
                
                {flashcardsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading flashcards...</p>
                  </div>
                ) : flashcards && flashcards.length > 0 ? (
                  <FlashcardDeck
                    flashcards={flashcards}
                    onSessionComplete={(stats) => {
                      console.log('Session completed:', stats);
                      toast({
                        title: 'Study session completed!',
                        description: `You got ${stats.correctAnswers} out of ${stats.totalCards} correct.`,
                      });
                    }}
                  />
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <BookOpen className="w-16 h-16 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Flashcards Available</h3>
                      <p className="text-gray-500 text-center mb-4">
                        This document is still being processed or no flashcards were generated.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab('upload')}
                      >
                        Upload Another Document
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Document Selected</h3>
                  <p className="text-gray-500 text-center mb-4">
                    Upload a PDF document first to start studying with flashcards.
                  </p>
                  <Button
                    onClick={() => setActiveTab('upload')}
                  >
                    Upload Document
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      <RecentDocumentsModal
        isOpen={showRecentModal}
        onClose={() => setShowRecentModal(false)}
        documents={Array.isArray(userDocuments) ? userDocuments : []}
        onSelectDocument={(document) => {
          setSelectedDocument(document);
          setActiveTab('study');
        }}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        userEmail={user?.email || 'guest@studyflow.app'}
        isPremium={false} // TODO: Get from user data
        documentsProcessed={Array.isArray(userDocuments) ? userDocuments.length : 0}
      />
      </div>
  );
}
