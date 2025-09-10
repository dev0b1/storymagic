import { useState, useEffect } from 'react';
import { EnhancedAudioPlayer } from '@/components/ui/enhanced-audio-player';
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronUp, 
  Download, 
  FileText, 
  BookOpen,
  Volume2,
  Play,
  Pause,
  Loader2,
  SkipForward,
  SkipBack,
  AlertCircle
} from 'lucide-react';
import { NARRATION_MODES } from '@/components/narration-mode-card';
import { createApiClient } from '@/lib/api-client';

interface SystemMessageProps {
  title: string;
  content: string;
  narrationMode: string;
  audioUrl?: string;
  savedAudioProvider?: string;
  storyId?: string;
  userId?: string;
  timestamp: Date;
  contentType?: string;
  source?: string;
  isGenerating?: boolean;
  isError?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  onRetry?: () => void;
}

export function SystemMessage({ 
  title, 
  content, 
  narrationMode, 
  audioUrl, 
  savedAudioProvider,
  storyId, 
  userId,
  timestamp, 
  contentType = 'general',
  source = 'text',
  isGenerating = false,
  isError = false,
  onPlayingChange,
  onRetry
}: SystemMessageProps) {
  const [showScript, setShowScript] = useState(false);
  const [audioState, setAudioState] = useState<{
    url?: string;
    isGenerating: boolean;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    error?: string;
  }>({ 
    url: audioUrl, 
    isGenerating: false, 
    isPlaying: false, 
    currentTime: 0, 
    duration: 0 
  });
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [highlightedText, setHighlightedText] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const { user, loading, signOut } = useAuth();


  const apiClient = createApiClient({user})

  // Auto-generate audio when story is created without audio
  useEffect(() => {
    if (!isGenerating && !isError && storyId && !audioUrl && !audioState.url && !audioState.isGenerating && retryCount < 3) {
      generateAudio();
    }
  }, [storyId, audioUrl, isGenerating, isError, retryCount]);

  // Update audio state when audioUrl prop changes
  useEffect(() => {
    if (audioUrl && audioUrl !== audioState.url) {
      setAudioState(prev => ({ ...prev, url: audioUrl, isGenerating: false, error: undefined }));
    }
  }, [audioUrl]);

  // Text highlighting based on audio progress
  useEffect(() => {
    if (audioState.isPlaying && audioState.duration > 0) {
      const progress = audioState.currentTime / audioState.duration;
      const words = content.split(' ');
      const currentWordIndex = Math.floor(progress * words.length);
      const highlightedWords = words.slice(0, currentWordIndex + 1);
      setHighlightedText(highlightedWords.join(' '));
    } else {
      setHighlightedText('');
    }
  }, [audioState.currentTime, audioState.duration, audioState.isPlaying, content]);

  // Initialize audio element
  useEffect(() => {
    if (audioState.url && !audioElement) {
      const audio = new Audio(audioState.url);
      
      audio.addEventListener('loadedmetadata', () => {
        setAudioState(prev => ({ ...prev, duration: audio.duration }));
      });
      
      audio.addEventListener('timeupdate', () => {
        setAudioState(prev => ({ ...prev, currentTime: audio.currentTime }));
      });
      
      audio.addEventListener('ended', () => {
        setAudioState(prev => ({ ...prev, isPlaying: false }));
        setHighlightedText('');
        onPlayingChange?.(false);
      });
      
      audio.addEventListener('error', () => {
        setAudioState(prev => ({ 
          ...prev, 
          isPlaying: false, 
          error: 'Failed to load audio' 
        }));
      });
      
      setAudioElement(audio);
    }
  }, [audioState.url, audioElement, onPlayingChange]);

  const generateAudio = async () => {
    if (!storyId) return;

    try {
      setAudioState(prev => ({ ...prev, isGenerating: true, error: undefined }));

      const { buildAuthHeaders } = await import('@/lib/request-headers');
      const headers = await buildAuthHeaders({ userId: userId || undefined });
       
      console.log("Generating audio with headers:", headers);
      const data = await apiClient.post(`/api/story/${storyId}/audio?withMusic=true`,{})
      
      
      if (data.audioUrl && data.audioUrl !== 'browser-tts') {
        setAudioState(prev => ({ 
          ...prev, 
          url: data.audioUrl, 
          isGenerating: false,
          error: undefined
        }));
      } else {
        setAudioState(prev => ({ 
          ...prev, 
          isGenerating: false,
          error: 'Audio generation not available' 
        }));
      }
    } catch (error) {
      console.error('Audio generation failed:', error);
      setRetryCount(prev => prev + 1);
      setAudioState(prev => ({ 
        ...prev, 
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to generate audio'
      }));
    }
  };

  const togglePlayPause = () => {
    if (!audioElement || audioState.error) return;
    
    if (audioState.isPlaying) {
      audioElement.pause();
      setAudioState(prev => ({ ...prev, isPlaying: false }));
      onPlayingChange?.(false);
    } else {
      audioElement.play().catch(error => {
        console.error('Audio play failed:', error);
        setAudioState(prev => ({ 
          ...prev, 
          error: 'Failed to play audio' 
        }));
      });
      setAudioState(prev => ({ ...prev, isPlaying: true }));
      onPlayingChange?.(true);
    }
  };

  const skipForward = () => {
    if (!audioElement) return;
    const newTime = Math.min(audioElement.currentTime + 10, audioState.duration);
    audioElement.currentTime = newTime;
  };

  const skipBackward = () => {
    if (!audioElement) return;
    const newTime = Math.max(audioElement.currentTime - 10, 0);
    audioElement.currentTime = newTime;
  };

  const retryAudioGeneration = () => {
    setRetryCount(0);
    setAudioState(prev => ({ ...prev, error: undefined }));
    generateAudio();
  };

  const formatTimeDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDownloadMP3 = () => {
    const audioToDownload = audioState.url || audioUrl;
    if (audioToDownload) {
      const link = document.createElement('a');
      link.href = audioToDownload;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadText = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_script.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getNarrationModeInfo = () => {
    return NARRATION_MODES.find(m => m.id === narrationMode) || NARRATION_MODES[0];
  };

  const modeInfo = getNarrationModeInfo();
  const hasAudio = audioState.url || audioUrl;
  const isAudioGenerating = audioState.isGenerating;

  // Error state
  if (isError) {
    return (
      <div className="flex justify-start mb-6">
        <div className="max-w-[90%] md:max-w-[85%]">
          <div className="bg-red-50 rounded-2xl rounded-bl-md border border-red-200 shadow-sm">
            <div className="px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 text-sm mb-1">Generation Failed</h4>
                  <p className="text-sm text-red-700 mb-3">{content}</p>
                  {onRetry && (
                    <Button
                      size="sm"
                      onClick={onRetry}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="px-4 pb-3 text-xs text-red-600">
              {formatTime(timestamp)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6">
      <div className="max-w-[90%] md:max-w-[85%] w-full">
        <div className="bg-white rounded-2xl rounded-bl-md border border-gray-200 shadow-sm">
          {/* Header with Topic and Horizontal Audio Controls */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              {/* Left side: Topic and Mode Info */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-base truncate">{title}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {modeInfo.icon} {modeInfo.name}
                    </Badge>
                    {source === 'pdf' && (
                      <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                        PDF
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Right side: Horizontal Audio Controls */}
              {!isGenerating && (
                <div className="flex items-center space-x-3">
                  {/* Audio Error State */}
                  {audioState.error && (
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-xs text-red-600">{audioState.error}</span>
                      {retryCount < 3 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={retryAudioGeneration}
                          className="text-xs h-6 px-2 text-red-600 hover:text-red-700"
                        >
                          Retry
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* Audio Generation Loading */}
                  {isAudioGenerating && (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      <span className="text-xs text-gray-600">Generating...</span>
                    </div>
                  )}
                  
                  {/* Complete Audio Controls */}
                  {hasAudio && !audioState.error && !isAudioGenerating && (
                    <div className="flex items-center space-x-2">
                      {/* Skip Backward */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={skipBackward}
                        disabled={!audioElement}
                        className="h-8 w-8 p-0 rounded-full hover:bg-gray-200"
                        title="Skip back 10 seconds"
                      >
                        <SkipBack className="w-4 h-4 text-gray-600" />
                      </Button>
                      
                      {/* Play/Pause */}
                      <Button
                        size="sm"
                        onClick={togglePlayPause}
                        className="h-9 w-9 p-0 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        {audioState.isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      
                      {/* Skip Forward */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={skipForward}
                        disabled={!audioElement}
                        className="h-8 w-8 p-0 rounded-full hover:bg-gray-200"
                        title="Skip forward 10 seconds"
                      >
                        <SkipForward className="w-4 h-4 text-gray-600" />
                      </Button>
                      
                      {/* Time Display */}
                      {audioState.duration > 0 && (
                        <div className="flex items-center space-x-2 ml-2">
                          <span className="text-xs text-gray-500 min-w-[60px]">
                            {formatTimeDisplay(audioState.currentTime)} / {formatTimeDisplay(audioState.duration)}
                          </span>
                          {/* Progress Bar */}
                          <div className="w-20 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${(audioState.currentTime / audioState.duration) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Download Controls */}
                  <div className="flex items-center space-x-1 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDownloadMP3}
                      disabled={!hasAudio}
                      className="text-xs h-7 px-2 text-gray-500 hover:text-gray-700"
                      title="Download Audio"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDownloadText}
                      className="text-xs h-7 px-2 text-gray-500 hover:text-gray-700"
                      title="Download Text"
                    >
                      <FileText className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content Text with Highlighting */}
          {!isGenerating && (
            <div className="px-6 py-4">
              <div className="prose prose-sm max-w-none leading-relaxed">
                {/* First 3 paragraphs with highlighting support */}
                {content.split('\n').slice(0, 3).map((paragraph, index) => {
                  if (audioState.isPlaying && highlightedText) {
                    // Split paragraph into highlighted and non-highlighted parts
                    const paragraphStart = content.split('\n').slice(0, index).join('\n').length + (index > 0 ? 1 : 0);
                    const paragraphEnd = paragraphStart + paragraph.length;
                    const highlightEnd = highlightedText.length;
                    
                    if (highlightEnd > paragraphStart) {
                      const highlightInParagraph = Math.min(highlightEnd - paragraphStart, paragraph.length);
                      const highlightedPart = paragraph.slice(0, highlightInParagraph);
                      const remainingPart = paragraph.slice(highlightInParagraph);
                      
                      return (
                        <p key={index} className="mb-3 last:mb-0">
                          <span className="bg-blue-100 text-blue-900 transition-all duration-300">
                            {highlightedPart}
                          </span>
                          <span className="text-gray-700">{remainingPart}</span>
                        </p>
                      );
                    }
                  }
                  
                  return (
                    <p key={index} className="mb-3 last:mb-0 text-gray-700">
                      {paragraph}
                    </p>
                  );
                })}
                
                {content.split('\n').length > 3 && !showScript && (
                  <p className="text-gray-500 text-sm mt-2">...</p>
                )}
              </div>
              
              {/* Extended content with highlighting */}
              {showScript && content.split('\n').length > 3 && (
                <div className="mt-4 prose prose-sm max-w-none leading-relaxed">
                  {content.split('\n').slice(3).map((paragraph, index) => {
                    const actualIndex = index + 3;
                    
                    if (audioState.isPlaying && highlightedText) {
                      // Calculate position in full content
                      const paragraphStart = content.split('\n').slice(0, actualIndex).join('\n').length + actualIndex;
                      const paragraphEnd = paragraphStart + paragraph.length;
                      const highlightEnd = highlightedText.length;
                      
                      if (highlightEnd > paragraphStart) {
                        const highlightInParagraph = Math.min(highlightEnd - paragraphStart, paragraph.length);
                        const highlightedPart = paragraph.slice(0, highlightInParagraph);
                        const remainingPart = paragraph.slice(highlightInParagraph);
                        
                        return (
                          <p key={actualIndex} className="mb-3 last:mb-0">
                            <span className="bg-blue-100 text-blue-900 transition-all duration-300">
                              {highlightedPart}
                            </span>
                            <span className="text-gray-700">{remainingPart}</span>
                          </p>
                        );
                      }
                    }
                    
                    return (
                      <p key={actualIndex} className="mb-3 last:mb-0 text-gray-700">
                        {paragraph}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {content.split('\n').length > 3 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowScript(!showScript)}
                    className="text-xs text-gray-600 h-7 px-3 hover:text-gray-900"
                  >
                    {showScript ? (
                      <><ChevronUp className="w-3 h-3 mr-1" /> Show less</>
                    ) : (
                      <><ChevronDown className="w-3 h-3 mr-1" /> Show more</>
                    )}
                  </Button>
                )}
                <span className="text-xs text-gray-500">
                  ~{content.split(' ').length} words • {contentType}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {formatTime(timestamp)}
              </div>
            </div>
          </div>

          {/* Generating State */}
          {isGenerating && (
            <div className="px-6 py-8 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4" />
              <p className="text-sm text-gray-600">{content}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
