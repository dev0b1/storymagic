import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Download, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StoryReaderProps {
  story: string;
  character: string;
  storyId?: string;
  userId?: string;
}

export function StoryReader({ story, character, storyId, userId }: StoryReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const paragraphs = story.split('\n\n').filter(p => p.trim());

  const generateAudio = async () => {
    if (!storyId || !userId) {
      toast({
        title: "Login required",
        description: "Please log in to generate audio",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const response = await fetch(`/api/story/${storyId}/audio`, {
        method: 'POST',
        headers: {
          'x-user-id': userId
        }
      });

      const result = await response.json();
      if (result.audioUrl) {
        setAudioUrl(result.audioUrl);
        toast({
          title: "Audio generated!",
          description: "Your story is ready to listen"
        });
      } else {
        toast({
          title: "Audio not available",
          description: "Audio generation is not configured"
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
    } else {
      // Text-based reading simulation
      setIsPlaying(true);
      simulateReading();
    }
  };

  const pauseStory = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
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
        clearInterval(interval);
      }
    }, 3000); // 3 seconds per paragraph
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
      };
    }
  }, [audioUrl]);

  return (
    <div className="space-y-6">
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
            <Button
              onClick={downloadAudio}
              variant="outline"
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
              data-testid="button-download-audio"
            >
              <Download className="w-4 h-4 mr-2" />
              Download MP3
            </Button>
          </>
        )}
      </div>

      {/* Story Text with Auto-scroll */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg max-h-96 overflow-y-auto">
        <div className="space-y-4">
          {paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className={`text-gray-800 leading-relaxed text-lg transition-all duration-500 ${
                isPlaying && currentParagraph === index
                  ? 'bg-yellow-100 p-3 rounded-lg border-l-4 border-yellow-400 transform scale-105'
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
    </div>
  );
}