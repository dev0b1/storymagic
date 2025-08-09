import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Download, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MagicalAudio } from './magical-audio';

interface StoryReaderProps {
  story: string;
  character: string;
  storyId?: string;
  userId?: string;
  usedFallback?: boolean;
}

export function StoryReader({ story, character, storyId, userId, usedFallback }: StoryReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [showMagicalBackground, setShowMagicalBackground] = useState(false);
  const [audioProvider, setAudioProvider] = useState<string>('none');
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const paragraphs = story.split('\n\n').filter(p => p.trim());

  const generateAudio = async () => {
    if (!storyId) {
      // If no storyId, use browser TTS directly
      playBrowserTTS();
      toast({
        title: "Audio ready!",
        description: "Using browser text-to-speech"
      });
      return;
    }
    
    // Use fallback userId if not provided (for demo users)
    const finalUserId = userId || 'demo-user';

    setIsGeneratingAudio(true);
    try {
      const response = await fetch(`/api/story/${storyId}/audio`, {
        method: 'POST',
        headers: {
          'x-user-id': finalUserId
        }
      });

      const result = await response.json();
      if (result.audioUrl) {
        setAudioProvider(result.provider || 'unknown');
        if (result.audioUrl === 'browser-tts') {
          // Use browser TTS as fallback
          playBrowserTTS();
          toast({
            title: "Audio ready!",
            description: `Using ${result.provider} text-to-speech`
          });
        } else {
          setAudioUrl(result.audioUrl);
          toast({
            title: "Audio generated!",
            description: `${result.message || 'Your story is ready to listen'}`
          });
        }
      } else {
        toast({
          title: "Audio not available",
          description: result.message || "Audio generation is not configured"
        });
      }
    } catch (error) {
      toast({
        title: "Audio generation failed",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const playStory = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      setShowMagicalBackground(true);
    } else {
      // Text-based reading simulation
      setIsPlaying(true);
      setShowMagicalBackground(true);
      simulateReading();
    }
  };

  const pauseStory = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setShowMagicalBackground(false);
  };

  const simulateReading = () => {
    // Auto-scroll through paragraphs
    let index = 0;
    const interval = setInterval(() => {
      if (index < paragraphs.length && isPlaying) {
        setCurrentParagraph(index);
        index++;
      } else {
        setIsPlaying(false);
        setCurrentParagraph(0);
        setShowMagicalBackground(false);
        clearInterval(interval);
      }
    }, 3000); // 3 seconds per paragraph
  };

  const playBrowserTTS = () => {
    if ('speechSynthesis' in window) {
      // Stop any existing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(story);
      setAudioProvider('browser');
      
      // Character-specific voice settings
      const voiceSettings = {
        lumi: { rate: 0.8, pitch: 1.1 },
        spark: { rate: 1.2, pitch: 1.3 },
        bella: { rate: 1.0, pitch: 1.0 }
      };
      
      const settings = voiceSettings[character as keyof typeof voiceSettings] || voiceSettings.lumi;
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      
      utterance.onstart = () => {
        setIsPlaying(true);
        setShowMagicalBackground(true);
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
        setShowMagicalBackground(false);
        setCurrentParagraph(0);
        toast({
          title: "Story complete!",
          description: "The magical tale has ended"
        });
      };
      
      // Track progress through paragraphs
      let wordCount = 0;
      const totalWords = story.split(' ').length;
      const wordsPerParagraph = paragraphs.map(p => p.split(' ').length);
      
      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          wordCount++;
          let currentWords = 0;
          for (let i = 0; i < paragraphs.length; i++) {
            currentWords += wordsPerParagraph[i];
            if (wordCount <= currentWords) {
              setCurrentParagraph(i);
              break;
            }
          }
        }
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `story-${character}-${Date.now()}.mp3`;
      link.click();
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentParagraph(0);
        setShowMagicalBackground(false);
      };
    }
  }, [audioUrl]);

  return (
    <div className="space-y-6">
      {/* TTS Provider Indicator */}
      {audioProvider !== 'none' && (
        <div className="text-center mb-4">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200">
            {audioProvider === 'elevenlabs' && (
              <>
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Premium ElevenLabs Voice
              </>
            )}
            {audioProvider === 'openai' && (
              <>
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                OpenAI Voice
              </>
            )}
            {audioProvider === 'browser' && (
              <>
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                Browser Text-to-Speech
              </>
            )}
          </div>
        </div>
      )}

      {usedFallback && (
        <div className="text-center mb-4">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 border border-orange-200">
            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
            Generated using backup storytelling system
          </div>
        </div>
      )}

      {/* Audio Controls */}
      <div className="flex flex-wrap gap-3 justify-center">
        {!audioUrl ? (
          <Button
            onClick={generateAudio}
            disabled={isGeneratingAudio}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            data-testid="button-generate-audio"
          >
            {isGeneratingAudio ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 mr-2" />
                Generate Audio
              </>
            )}
          </Button>
        ) : (
          <>
            <Button
              onClick={isPlaying ? pauseStory : playStory}
              className="bg-green-600 hover:bg-green-700 text-white"
              data-testid="button-play-pause"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Play Story
                </>
              )}
            </Button>
            {audioUrl && audioUrl !== 'browser-tts' && (
              <Button
                onClick={downloadAudio}
                variant="outline"
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
                data-testid="button-download-audio"
              >
                <Download className="w-4 h-4 mr-2" />
                Download MP3
              </Button>
            )}
          </>
        )}
      </div>

      {/* Story Text with Auto-scroll and Magical Background */}
      <div className={`relative overflow-hidden rounded-2xl p-6 shadow-lg max-h-96 overflow-y-auto transition-all duration-1000 ${
        showMagicalBackground 
          ? 'bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100' 
          : 'bg-white/80 backdrop-blur-sm'
      }`}>
        {/* Magical sparkles during storytelling */}
        {showMagicalBackground && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-4 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
            <div className="absolute top-12 right-8 w-1 h-1 bg-purple-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute bottom-8 left-12 w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse opacity-70" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-4 right-4 w-1 h-1 bg-indigo-400 rounded-full animate-ping opacity-65" style={{ animationDelay: '1.5s' }}></div>
            <div className="absolute top-20 left-1/2 w-1 h-1 bg-green-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '2s' }}></div>
          </div>
        )}
        
        <div className="relative z-10 space-y-4">
          {paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className={`text-gray-800 leading-relaxed text-lg transition-all duration-500 ${
                isPlaying && currentParagraph === index
                  ? 'bg-yellow-100/90 p-3 rounded-lg border-l-4 border-yellow-400 transform scale-105 shadow-md'
                  : 'opacity-70 hover:opacity-100'
              }`}
              data-testid={`paragraph-${index}`}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Hidden audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          className="hidden"
        />
      )}

      {/* Magical background audio during storytelling */}
      <MagicalAudio isPlaying={isPlaying} volume={0.1} />
    </div>
  );
}