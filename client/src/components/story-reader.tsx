import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Download, Volume2, VolumeX, SkipBack, SkipForward, Volume1, Music } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { MagicalAudio } from './magical-audio';

interface StoryReaderProps {
  story: string;
  narrationMode: string;
  storyId?: string;
  userId?: string;
  usedFallback?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  isGenerating?: boolean;
  contentType?: string;
  source?: string;
}

export function StoryReader({ story, narrationMode, storyId, userId, usedFallback, onPlayingChange, isGenerating = false, contentType, source }: StoryReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [showMagicalBackground, setShowMagicalBackground] = useState(false);
  const [audioProvider, setAudioProvider] = useState<string>('none');
  const [backgroundAudioEnabled, setBackgroundAudioEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playOnLoadRef = useRef(false);
  const { toast } = useToast();

  const paragraphs = story.split('\n\n').filter(p => p.trim());

  const generateAudio = async (): Promise<{ url: string | null; provider: string }> => {
    if (!storyId) {
      toast({ 
        title: 'Story ID Required', 
        description: 'Please save your story first to generate audio',
        variant: 'destructive'
      });
      return { url: null, provider: 'none' };
    }

    // Add background music preference to URL
    const params = new URLSearchParams({
      withMusic: backgroundAudioEnabled ? 'true' : 'false'
    }).toString();
    
    const finalUserId = userId || 'demo-user';
    setIsGeneratingAudio(true);
    
    try {
      console.log('🎵 Generating audio for story:', { storyId, userId: finalUserId });
      const response = await fetch(`/api/story/${storyId}/audio?${params}`, { 
        method: 'POST', 
        headers: { 
          'x-user-id': finalUserId,
          'Content-Type': 'application/json'
        } 
      });
      
      const result = await response.json();
      
      if (result.audioUrl && result.audioUrl !== 'browser-tts') {
        setAudioProvider(result.provider || 'unknown');
        setAudioUrl(result.audioUrl);
        toast({ 
          title: 'Audio generated!', 
          description: result.message || 'Your story is ready to listen' 
        });
        return { url: result.audioUrl as string, provider: result.provider || 'unknown' };
      } else {
        toast({ 
          title: 'Audio generation failed', 
          description: result.message || 'Audio generation is not configured. Please check your API keys.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Audio generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('❌ Audio generation failed:', errorMessage);
      toast({ 
        title: 'Audio generation failed', 
        description: errorMessage || 'Please try again later', 
        variant: 'destructive' 
      });
    } finally {
      setIsGeneratingAudio(false);
    }
    
    return { url: null, provider: 'none' };
  };

  const playStory = async () => {
    if (isPlaying) {
      // If already playing, pause
      if (audioRef.current && audioRef.current.src) {
        audioRef.current.pause();
        setIsPaused(true);
        setIsPlaying(false);
        setShowMagicalBackground(false);
        onPlayingChange?.(false);
      }
      return;
    }

    // If paused, resume
    if (isPaused && audioRef.current && audioRef.current.src) {
      audioRef.current.play();
      setIsPaused(false);
      setIsPlaying(true);
      setShowMagicalBackground(true);
      onPlayingChange?.(true);
      return;
    }

    // If no audio exists, generate it first
    if (!audioUrl) {
      const result = await generateAudio();
      if (result.url && result.url !== 'browser-tts') {
        setAudioUrl(result.url);
        setAudioProvider(result.provider || 'openai');
        
        // Auto-play the generated audio
        if (audioRef.current) {
          audioRef.current.src = result.url;
          audioRef.current.load();
          await audioRef.current.play();
          setIsPlaying(true);
          setIsPaused(false);
          setShowMagicalBackground(true);
          onPlayingChange?.(true);
        }
      }
      return;
    }

    // Play existing audio
    if (audioRef.current && audioRef.current.src) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setIsPaused(false);
        setShowMagicalBackground(true);
        onPlayingChange?.(true);
      } catch (error) {
        console.error('Error playing audio:', error);
        toast({
          title: "Playback Error",
          description: "Failed to play audio. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  // Remove browser TTS functions - we only use server audio now
  
  const handleAudioControl = (action: 'play' | 'pause' | 'forward' | 'backward') => {
    if (action === 'play') {
      playStory();
      return;
    }

    if (action === 'pause') {
      if (audioRef.current && audioRef.current.src && audioRef.current.currentTime > 0) {
        audioRef.current.pause();
        setIsPaused(true);
        setIsPlaying(false);
        setShowMagicalBackground(false);
        onPlayingChange?.(false);
      }
      return;
    }

    if (action === 'forward') {
      if (audioRef.current && audioRef.current.currentTime) {
        audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, audioRef.current.duration);
      }
      return;
    }

    if (action === 'backward') {
      if (audioRef.current && audioRef.current.currentTime) {
        audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
      }
      return;
    }
  };
  
  const stopStory = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsPaused(false);
    setShowMagicalBackground(false);
    onPlayingChange?.(false);
  };

  useEffect(() => {
    const audio = audioRef.current; if (!audio) return;
    const handlePlay = () => { setIsPlaying(true); setIsPaused(false); setShowMagicalBackground(true); onPlayingChange?.(true); };
    const handlePause = () => { setIsPlaying(false); setIsPaused(true); setShowMagicalBackground(false); onPlayingChange?.(false); };
    const handleEnded = () => { setIsPlaying(false); setIsPaused(false); setShowMagicalBackground(false); onPlayingChange?.(false); };
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    return () => { audio.removeEventListener('play', handlePlay); audio.removeEventListener('pause', handlePause); audio.removeEventListener('ended', handleEnded); };
  }, [onPlayingChange]);

  // Auto-play when a new audioUrl arrives and play was requested
  useEffect(() => {
    if (!audioUrl || !playOnLoadRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;
    const start = async () => {
      try {
        if (audio.readyState >= 3) {
          await audio.play();
        } else {
          await new Promise<void>((resolve) => {
            const onCanPlay = () => { audio.removeEventListener('canplaythrough', onCanPlay); resolve(); };
            audio.addEventListener('canplaythrough', onCanPlay, { once: true });
          });
          await audio.play();
        }
        setIsPlaying(true);
        setIsPaused(false);
        setShowMagicalBackground(true);
        onPlayingChange?.(true);
      } catch {}
      finally {
        playOnLoadRef.current = false;
      }
    };
    start();
  }, [audioUrl, onPlayingChange]);

  useEffect(() => {
    const handleGenerate = async () => {
      // Mark that we should auto-play if a URL arrives (only when invoked from header)
      playOnLoadRef.current = false;
      await generateAudio();
    };
    const handleDownload = async () => { await downloadAudio(); };
    window.addEventListener('storymagic:generate-audio', handleGenerate);
    window.addEventListener('storymagic:download-audio', handleDownload);
    return () => {
      window.removeEventListener('storymagic:generate-audio', handleGenerate);
      window.removeEventListener('storymagic:download-audio', handleDownload);
    };
  }, [audioUrl, storyId, userId]);

  const downloadAudio = async () => {
    if (audioUrl && audioUrl !== 'browser-tts') {
      // Download server-generated audio
      const link = document.createElement('a');
      link.href = audioUrl; 
      link.download = `story-${storyId || Date.now()}.mp3`; 
      link.click();
      toast({
        title: "Audio downloaded!",
        description: "Your narrated story has been saved 🎵"
      });
    } else {
      // Download story as text file
      const blob = new Blob([story], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `story-${storyId || Date.now()}.txt`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Story downloaded!",
        description: "Your story has been saved as a text file 📚"
      });
    }
  };

  const toggleBackgroundAudio = () => {
    setBackgroundAudioEnabled(!backgroundAudioEnabled);
    toast({ title: backgroundAudioEnabled ? 'Ambient audio disabled' : 'Ambient audio enabled', description: backgroundAudioEnabled ? 'Background music turned off' : 'Background music turned on' });
  };

  return (
    <div className="space-y-4">
      {usedFallback && (
        <div className="text-center mb-2">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 border border-orange-200">
            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
            Generated using backup storytelling system
          </div>
        </div>
      )}

      {/* Audio Provider Badge */}
      {audioProvider && audioProvider !== 'none' && (
        <div className="text-center mb-2">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-700 border border-green-200">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            {audioProvider === 'elevenlabs' ? 'ElevenLabs' : 
             audioProvider === 'openai' ? 'OpenAI' : 
             audioProvider === 'browser' ? 'Browser TTS' : audioProvider}
          </div>
        </div>
      )}

      {/* Enhanced Audio Controls */}
      <div className="flex flex-wrap gap-3 justify-center items-center">
        {/* Background Music Toggle */}
        <div className="flex items-center gap-2">
          <Music className={`w-4 h-4 ${backgroundAudioEnabled ? 'text-purple-600' : 'text-gray-400'}`} />
          <Switch
            checked={backgroundAudioEnabled}
            onCheckedChange={toggleBackgroundAudio}
            className="data-[state=checked]:bg-purple-600"
            aria-label="Toggle background music"
          />
        </div>
        
        {/* Smart Play/Generate Button */}
        <Button 
          onClick={playStory} 
          className="bg-green-600 hover:bg-green-700 text-white" 
          data-testid="button-play-pause"
        >
          {isPlaying ? (
            <><Pause className="w-4 h-4 mr-2"/>Pause</>
          ) : audioUrl ? (
            <><Play className="w-4 h-4 mr-2"/>Play Story</>
          ) : (
            <><Volume1 className="w-4 h-4 mr-2"/>Generate & Play</>
          )}
        </Button>

        {/* Audio Control Panel */}
        {isPlaying && (
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAudioControl('backward')}
              className="h-8 px-2 text-purple-700 hover:bg-purple-100"
              title="Backward 10 seconds"
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAudioControl('forward')}
              className="h-8 px-2 text-purple-700 hover:bg-purple-100"
              title="Forward 10 seconds"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={stopStory}
              className="h-8 px-2 text-red-600 hover:bg-red-100"
              title="Stop"
            >
              <VolumeX className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Background Audio Toggle */}
        <Button 
          onClick={toggleBackgroundAudio} 
          variant="outline" 
          className={`border-purple-200 text-purple-700 hover:bg-purple-50 ${!backgroundAudioEnabled ? 'bg-red-50 border-red-200 text-red-700' : ''}`}
        >
          {backgroundAudioEnabled ? (
            <><Volume2 className="w-4 h-4 mr-2"/>Ambient On</>
          ) : (
            <><VolumeX className="w-4 h-4 mr-2"/>Ambient Off</>
          )}
        </Button>

        {/* Download Button - Always show when we have audio */}
        {audioUrl && (
          <Button 
            onClick={downloadAudio} 
            variant="outline" 
            className="border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2"/>
            {audioUrl === 'browser-tts' ? 'Download Text' : 'Download Audio'}
          </Button>
        )}
      </div>

      <div className={`relative overflow-hidden rounded-2xl p-6 shadow-lg max-h-96 overflow-y-auto transition-all duration-500 ${showMagicalBackground ? 'bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 border border-purple-200' : 'bg-white/90 backdrop-blur-sm border border-gray-200'} ${isGenerating ? 'animate-pulse bg-gradient-to-r from-purple-50 to-pink-50' : ''}`}>
        {showMagicalBackground && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 right-4 w-1 h-1 bg-purple-400 rounded-full animate-pulse opacity-60"></div>
            <div className="absolute bottom-4 left-4 w-1 h-1 bg-pink-400 rounded-full animate-pulse opacity-60" style={{ animationDelay: '1s' }}></div>
          </div>
        )}
        <div className="relative z-10 space-y-4">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className={`text-gray-800 leading-relaxed text-lg transition-colors duration-300 ${isPlaying && currentParagraph === index ? 'p-4 rounded-lg ring-1 ring-purple-300/60 bg-gradient-to-r from-amber-50/70 to-indigo-50/70 shadow-sm' : 'hover:bg-gray-50/60 p-2 rounded-lg'}`} data-testid={`paragraph-${index}`}>{paragraph}</p>
          ))}
        </div>
      </div>
      {audioUrl && (<audio ref={audioRef} src={audioUrl} className="hidden" />)}
      <MagicalAudio isPlaying={isPlaying && backgroundAudioEnabled} volume={0.15} character={narrationMode} />
    </div>
  );
}