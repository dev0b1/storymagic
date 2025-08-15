import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Download, Volume1, VolumeX, Music, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StoryDisplayProps {
  story: string;
  character: string;
  isGenerating?: boolean;
  storyId?: string;
}

export function StoryDisplay({ story, character, isGenerating = false, storyId }: StoryDisplayProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [backgroundMusicPlaying, setBackgroundMusicPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioProvider, setAudioProvider] = useState<string>('');
  const { toast } = useToast();
  
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Using Web Audio API for reliable background ambience
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize Web Audio API for background ambience
  useEffect(() => {
    return () => {
      // Cleanup audio context
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch (e) {
          // Oscillator already stopped
        }
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Story typing effect
  useEffect(() => {
    if (story && !isGenerating) {
      setIsTyping(true);
      setDisplayedText('');
      
      let index = 0;
      const typeInterval = setInterval(() => {
        if (index < story.length) {
          setDisplayedText(story.slice(0, index + 1));
          index++;
        } else {
          setIsTyping(false);
          clearInterval(typeInterval);
        }
      }, 30);

      return () => clearInterval(typeInterval);
    }
  }, [story, isGenerating]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(story);
      toast({
        title: "Copied to clipboard!",
        description: "Your magical story is ready to share ✨"
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please try selecting and copying manually",
        variant: "destructive"
      });
    }
  };

  const handleDownload = () => {
    if (audioUrl && audioUrl !== 'browser-tts') {
      // Download audio file
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `story-${storyId || Date.now()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Audio downloaded!",
        description: "Your narrated story has been saved 🎵"
      });
    } else {
      // Download text file
      const blob = new Blob([story], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `magical-story-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Story downloaded!",
        description: "Your magical tale has been saved 📚"
      });
    }
  };

  const generateServerAudio = async () => {
    if (!storyId) {
      toast({
        title: "No story ID",
        description: "Cannot generate server audio without story ID",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const response = await fetch(`/api/story/${storyId}/audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('userId') || 'demo'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const data = await response.json();
      setAudioUrl(data.audioUrl);
      setAudioProvider(data.provider);
      
      if (data.audioUrl && data.audioUrl !== 'browser-tts') {
        toast({
          title: "Audio generated!",
          description: `Server audio ready using ${data.provider} 🎵`
        });
      } else {
        toast({
          title: "Using browser TTS",
          description: "Server audio not available, using browser synthesis"
        });
      }
    } catch (error) {
      console.error('Audio generation error:', error);
      toast({
        title: "Audio generation failed",
        description: "Falling back to browser TTS",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const startBackgroundMusic = async () => {
    if (!musicEnabled) return;
    
    try {
      // Create Audio Context if not exists
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      // Resume context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      // Create magical ambient sound
      if (!oscillatorRef.current) {
        oscillatorRef.current = audioContextRef.current.createOscillator();
        gainNodeRef.current = audioContextRef.current.createGain();
        
        // Connect nodes
        oscillatorRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(audioContextRef.current.destination);
        
        // Set magical frequency and volume
        oscillatorRef.current.frequency.setValueAtTime(220, audioContextRef.current.currentTime);
        oscillatorRef.current.type = 'sine';
        gainNodeRef.current.gain.setValueAtTime(0.1, audioContextRef.current.currentTime); // Very quiet
        
        oscillatorRef.current.start();
        setBackgroundMusicPlaying(true);
      }
    } catch (error) {
      console.log('Web Audio API not supported or blocked');
    }
  };

  const stopBackgroundMusic = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current = null;
        setBackgroundMusicPlaying(false);
      } catch (e) {
        // Already stopped
      }
    }
  };

  const toggleMusic = () => {
    const newMusicState = !musicEnabled;
    setMusicEnabled(newMusicState);
    if (!newMusicState) {
      stopBackgroundMusic();
    }
  };

  const handleAudioControl = (action: 'play' | 'pause' | 'forward' | 'backward') => {
    if (!audioRef.current) return;

    switch (action) {
      case 'play':
        if (isPaused) {
          audioRef.current.play();
          setIsPaused(false);
        } else {
          handleSpeak();
        }
        break;
      case 'pause':
        if (isSpeaking && !isPaused) {
          speechSynthesis.pause();
          setIsPaused(true);
        } else if (isPaused) {
          speechSynthesis.resume();
          setIsPaused(false);
        }
        break;
      case 'forward':
        if (audioRef.current.currentTime) {
          audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, audioRef.current.duration);
        }
        break;
      case 'backward':
        if (audioRef.current.currentTime) {
          audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
        }
        break;
    }
  };

  const handleSpeak = async () => {
    if (audioUrl && audioUrl !== 'browser-tts') {
      // Use server-generated audio
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          stopBackgroundMusic();
        };
        audioRef.current.onpause = () => setIsPaused(true);
        audioRef.current.onplay = () => setIsPaused(false);
      }
      
      if (isPaused) {
        audioRef.current.play();
        setIsPaused(false);
      } else {
        audioRef.current.play();
        setIsSpeaking(true);
        if (musicEnabled) {
          await startBackgroundMusic();
        }
      }
      
      toast({
        title: "Playing server audio!",
        description: "Enjoy your narrated story with background music 🎵"
      });
    } else {
      // Use browser TTS
      if ('speechSynthesis' in window) {
        // Stop any current speech and music
        speechSynthesis.cancel();
        stopBackgroundMusic();
        
        setIsSpeaking(true);
        setIsPaused(false);
        
        // Start background music if enabled
        if (musicEnabled) {
          await startBackgroundMusic();
        }
        
        const utterance = new SpeechSynthesisUtterance(story);
        utterance.rate = 0.8;
        utterance.pitch = 1.1;
        
        // Try to find a more suitable voice
        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.name.includes('Female') || 
          voice.name.includes('Google UK English Female') ||
          voice.name.includes('Microsoft Zira')
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        // Handle speech end
        utterance.onend = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          stopBackgroundMusic();
        };
        
        utterance.onerror = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          stopBackgroundMusic();
        };
        
        speechSynthesis.speak(utterance);
        
        toast({
          title: "Story narration started!",
          description: "Listen to your magical tale with background music"
        });
      } else {
        toast({
          title: "Speech not supported",
          description: "Your browser doesn't support text-to-speech",
          variant: "destructive"
        });
      }
    }
  };

  const handleStopSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    stopBackgroundMusic();
    
    toast({
      title: "Narration stopped",
      description: "Story playback has been stopped"
    });
  };

  if (isGenerating) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-magical text-xl text-purple-800">✨ Weaving Your Tale...</h3>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-purple-600">Creating magic...</span>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-magical text-xl text-purple-800">✨ Your Magical Tale</h3>
        </div>
        <div className="text-center text-gray-500 py-12">
          <div className="text-4xl mb-4">📜</div>
          <p>Your magical story will appear here...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-magical text-xl text-purple-800">✨ Your Magical Tale</h3>
        <div className="flex space-x-2">
          {/* Audio Controls */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {!isSpeaking ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAudioControl('play')}
                className="h-8 px-2 text-purple-700 hover:bg-purple-100"
                disabled={isGeneratingAudio}
              >
                <Play className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAudioControl('pause')}
                className="h-8 px-2 text-purple-700 hover:bg-purple-100"
              >
                <Pause className="w-4 h-4" />
              </Button>
            )}
            
            {isSpeaking && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAudioControl('backward')}
                  className="h-8 px-2 text-purple-700 hover:bg-purple-100"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAudioControl('forward')}
                  className="h-8 px-2 text-purple-700 hover:bg-purple-100"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleStopSpeech}
              className="h-8 px-2 text-red-600 hover:bg-red-100"
            >
              <VolumeX className="w-4 h-4" />
            </Button>
          </div>

          {/* Generate Server Audio Button */}
          {storyId && !audioUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={generateServerAudio}
              disabled={isGeneratingAudio}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200"
            >
              {isGeneratingAudio ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              ) : (
                <Volume1 className="w-4 h-4 mr-2" />
              )}
              {isGeneratingAudio ? 'Generating...' : 'Generate Audio'}
            </Button>
          )}

          {/* Audio Provider Badge */}
          {audioProvider && (
            <div className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
              {audioProvider === 'elevenlabs' ? 'ElevenLabs' : 
               audioProvider === 'openai' ? 'OpenAI' : 
               audioProvider === 'browser' ? 'Browser TTS' : audioProvider}
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={toggleMusic}
            className={`${musicEnabled ? 'bg-green-100 hover:bg-green-200 text-green-700 border-green-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-500 border-gray-200'}`}
          >
            <Music className="w-4 h-4 mr-2" />
            {musicEnabled ? 'Music On' : 'Music Off'}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            <Download className="w-4 h-4 mr-2" />
            {audioUrl && audioUrl !== 'browser-tts' ? 'Download Audio' : 'Download Text'}
          </Button>
        </div>
      </div>
      
      <div className="prose prose-purple max-w-none">
        <div className="whitespace-pre-wrap leading-relaxed text-gray-800">
          {displayedText}
          {isTyping && <span className="animate-pulse">|</span>}
        </div>
      </div>
    </div>
  );
}
