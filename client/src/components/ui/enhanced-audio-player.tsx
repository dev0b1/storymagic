import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Download,
  Settings,
  BookOpen,
  Clock,
  Gauge
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface Chapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
}

interface EnhancedAudioPlayerProps {
  audioUrl?: string;
  title: string;
  narrationMode: string;
  chapters?: Chapter[];
  isGenerating?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  className?: string;
}

export function EnhancedAudioPlayer({
  audioUrl,
  title,
  narrationMode,
  chapters = [],
  isGenerating = false,
  onPlayingChange,
  className = ""
}: EnhancedAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [showWaveform, setShowWaveform] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Wave visualization bars
  const waveformBars = Array.from({ length: 32 }, (_, i) => i);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = useCallback(() => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
    onPlayingChange?.(isPlaying);
  }, [isPlaying, audioUrl, onPlayingChange]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      
      // Update current chapter
      const chapter = chapters.find(c => time >= c.startTime && time <= c.endTime);
      setCurrentChapter(chapter || null);
    }
  };

  const handleSeek = (value: number[]) => {
    const time = value[0];
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
    }
  };

  const jumpToChapter = (chapter: Chapter) => {
    if (audioRef.current) {
      audioRef.current.currentTime = chapter.startTime;
      setCurrentTime(chapter.startTime);
    }
  };

  const handleDownload = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
        setIsLoading(false);
      };

      const handleLoadStart = () => setIsLoading(true);
      const handleCanPlay = () => setIsLoading(false);
      const handleEnded = () => {
        setIsPlaying(false);
        onPlayingChange?.(false);
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadstart', handleLoadStart);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadstart', handleLoadStart);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [audioUrl, onPlayingChange]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`bg-white rounded-xl border card-professional p-6 ${className}`}>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-professional rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-promptbook font-semibold text-lg text-gray-900 line-clamp-1">
              {title || 'Audio Content'}
            </h3>
            <Badge variant="secondary" className="mt-1">
              {narrationMode} Mode
            </Badge>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!audioUrl || isGenerating}
            className="border-promptbook-blue text-promptbook-blue hover:bg-blue-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Waveform Visualization */}
      {showWaveform && audioUrl && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="audio-wave-visual justify-center h-16">
            {waveformBars.map((bar) => (
              <div
                key={bar}
                className={`audio-wave-bar ${
                  isPlaying && bar < (progress / 100) * waveformBars.length 
                    ? 'active animate-audio-wave' 
                    : ''
                }`}
                style={{
                  height: `${20 + Math.sin(bar * 0.5) * 15}px`,
                  animationDelay: `${bar * 0.05}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>{formatTime(currentTime)}</span>
          {currentChapter && (
            <Badge variant="outline" className="text-xs">
              {currentChapter.title}
            </Badge>
          )}
          <span>{formatTime(duration)}</span>
        </div>
        <Slider
          value={[currentTime]}
          max={duration}
          step={1}
          onValueChange={handleSeek}
          disabled={!audioUrl || isGenerating}
          className="w-full"
        />
        <div 
          className="w-full h-1 bg-gray-200 rounded-full mt-2 overflow-hidden"
          ref={progressRef}
        >
          <div 
            className="h-full bg-promptbook-blue transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={skipBackward}
            disabled={!audioUrl || isGenerating}
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={handlePlayPause}
            disabled={!audioUrl || isGenerating || isLoading}
            className="w-12 h-12 bg-promptbook-blue hover:bg-promptbook-blue-dark text-white rounded-full"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={skipForward}
            disabled={!audioUrl || isGenerating}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Volume and Settings */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              disabled={!audioUrl}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              disabled={!audioUrl}
              className="w-20"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={!audioUrl}>
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center">
                <Gauge className="w-4 h-4 mr-2" />
                Playback Speed
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <DropdownMenuItem
                  key={rate}
                  onClick={() => handlePlaybackRateChange(rate)}
                  className={playbackRate === rate ? 'bg-blue-50' : ''}
                >
                  {rate}x {rate === 1 && '(Normal)'}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowWaveform(!showWaveform)}>
                {showWaveform ? 'Hide' : 'Show'} Waveform
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Chapters */}
      {chapters.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Chapters
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                onClick={() => jumpToChapter(chapter)}
                className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                  currentChapter?.id === chapter.id
                    ? 'bg-blue-50 text-promptbook-blue'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
                disabled={!audioUrl}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{chapter.title}</span>
                  <span className="text-xs text-gray-500">
                    {formatTime(chapter.startTime)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Audio State */}
      {!audioUrl && !isGenerating && (
        <div className="text-center py-8 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No audio generated yet</p>
          <p className="text-sm">Generate audio to start listening</p>
        </div>
      )}

      {/* Generating State */}
      {isGenerating && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-promptbook-blue mx-auto mb-3" />
          <p className="font-medium text-promptbook-blue">Generating audio...</p>
          <p className="text-sm text-gray-500">This may take a few moments</p>
        </div>
      )}
    </div>
  );
}
