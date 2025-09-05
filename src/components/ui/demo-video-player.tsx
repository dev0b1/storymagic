import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2,
  Minimize2
} from 'lucide-react';

interface DemoVideoProps {
  title: string;
  description: string;
  videoUrl: string;
  mode: 'lecture' | 'guide' | 'narrative' | 'podcast';
  duration?: string;
  thumbnailUrl?: string;
  className?: string;
}

const modeConfig = {
  lecture: {
    icon: '🎓',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Professional, clear delivery for educational content'
  },
  guide: {
    icon: '📚',
    color: 'bg-green-100 text-green-800 border-green-200',
    description: 'Friendly, conversational explanations'
  },
  narrative: {
    icon: '📖',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Engaging storytelling while preserving accuracy'
  },
  podcast: {
    icon: '🎙️',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    description: 'Multi-voice podcast format with sound effects'
  }
};

export function DemoVideoPlayer({
  title,
  description,
  videoUrl,
  mode,
  duration = '2:30',
  thumbnailUrl,
  className = ''
}: DemoVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted for better UX
  const [showControls, setShowControls] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const config = modeConfig[mode];

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const handleVideoLoad = () => {
    setIsLoaded(true);
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  // Hide controls after 3 seconds of no interaction in fullscreen
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isFullscreen && showControls) {
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    
    return () => clearTimeout(timeout);
  }, [showControls, isFullscreen]);

  // Show controls on mouse move in fullscreen
  const handleMouseMove = () => {
    if (isFullscreen) {
      setShowControls(true);
    }
  };

  return (
    <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${className}`}>
      <div 
        ref={containerRef}
        className="relative group"
        onMouseMove={handleMouseMove}
      >
        <div className="aspect-video bg-gray-100 relative overflow-hidden">
          {/* Thumbnail overlay when not loaded/playing */}
          {(!isLoaded || !isPlaying) && thumbnailUrl && (
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${thumbnailUrl})` }}
            />
          )}
          
          {/* Video element */}
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            muted={isMuted}
            onLoadedData={handleVideoLoad}
            onEnded={handleVideoEnd}
            preload="metadata"
          />
          
          {/* Play button overlay */}
          <div 
            className={`absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer transition-opacity ${
              isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
            } ${isFullscreen && !showControls ? 'opacity-0' : ''}`}
            onClick={handlePlayPause}
          >
            <Button
              size="lg"
              className="bg-white/90 text-gray-900 hover:bg-white w-16 h-16 rounded-full"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-1" />
              )}
            </Button>
          </div>
          
          {/* Controls overlay */}
          <div 
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 transition-opacity ${
              (!isFullscreen || showControls) ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                <span className="text-white text-sm">{duration}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge className={config.color}>
                  {config.icon} {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Loading indicator */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-promptbook-blue" />
            </div>
          )}
        </div>
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-promptbook">{title}</CardTitle>
          <Badge variant="outline" className={config.color}>
            {config.icon} {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Badge>
        </div>
        <CardDescription className="text-sm">
          {config.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 leading-relaxed">
          {description}
        </p>
        
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlayPause}
            className="border-promptbook-blue text-promptbook-blue hover:bg-blue-50"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause Demo
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Play Demo
              </>
            )}
          </Button>
          <span className="text-xs text-gray-500">{duration}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Demo videos grid component
interface DemoVideosGridProps {
  className?: string;
}

export function DemoVideosGrid({ className = '' }: DemoVideosGridProps) {
  // In a real implementation, these would be actual video URLs
  const demoVideos = [
    {
      title: 'Machine Learning Basics',
      description: 'See how Lecture mode transforms complex technical concepts into clear, structured audio lessons perfect for learning.',
      videoUrl: '/demos/lecture-mode.mp4',
      thumbnailUrl: '/demos/thumbnails/lecture.jpg',
      mode: 'lecture' as const,
      duration: '2:45'
    },
    {
      title: 'Project Management Guide',
      description: 'Experience Guide mode as it explains business processes in a friendly, conversational tone that\'s easy to follow.',
      videoUrl: '/demos/guide-mode.mp4',
      thumbnailUrl: '/demos/thumbnails/guide.jpg',
      mode: 'guide' as const,
      duration: '3:12'
    },
    {
      title: 'History of Innovation',
      description: 'Listen to Narrative mode bring historical content to life with engaging storytelling while maintaining accuracy.',
      videoUrl: '/demos/narrative-mode.mp4',
      thumbnailUrl: '/demos/thumbnails/narrative.jpg',
      mode: 'narrative' as const,
      duration: '2:58'
    },
    {
      title: 'Tech Industry Insights',
      description: 'Discover Podcast mode\'s multi-voice format with sound effects, creating an immersive discussion experience.',
      videoUrl: '/demos/podcast-mode.mp4',
      thumbnailUrl: '/demos/thumbnails/podcast.jpg',
      mode: 'podcast' as const,
      duration: '3:33'
    }
  ];

  return (
    <div className={`grid md:grid-cols-2 gap-6 ${className}`}>
      {demoVideos.map((video, index) => (
        <DemoVideoPlayer
          key={index}
          {...video}
          className="animate-fade-in"
        />
      ))}
    </div>
  );
}
