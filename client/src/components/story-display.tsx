import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Download, Volume1, VolumeX, Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StoryDisplayProps {
  story: string;
  character: string;
  isGenerating?: boolean;
}

export function StoryDisplay({ story, character, isGenerating = false }: StoryDisplayProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [backgroundMusicPlaying, setBackgroundMusicPlaying] = useState(false);
  const { toast } = useToast();
  
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  
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

  const handleSpeak = async () => {
    if ('speechSynthesis' in window) {
      // Stop any current speech and music
      speechSynthesis.cancel();
      stopBackgroundMusic();
      
      setIsSpeaking(true);
      
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
        stopBackgroundMusic();
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
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
  };

  const handleStopSpeech = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
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
          {!isSpeaking ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSpeak}
              className="bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-200"
              data-testid="button-speak"
            >
              <Volume1 className="w-4 h-4 mr-2" />
              Listen
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleStopSpeech}
              className="bg-red-100 hover:bg-red-200 text-red-700 border-red-200"
              data-testid="button-stop-speak"
            >
              <VolumeX className="w-4 h-4 mr-2" />
              Stop
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={toggleMusic}
            className={`${musicEnabled ? 'bg-green-100 hover:bg-green-200 text-green-700 border-green-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-500 border-gray-200'}`}
            data-testid="button-toggle-music"
          >
            <Music className="w-4 h-4 mr-2" />
            {musicEnabled ? 'Music On' : 'Music Off'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700"
            data-testid="button-copy"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700"
            data-testid="button-download"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
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
