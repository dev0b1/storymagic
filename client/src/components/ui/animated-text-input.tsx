import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface AnimatedTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isGenerating?: boolean;
  isPlaying?: boolean;
  character?: string;
  disabled?: boolean;
}

export function AnimatedTextInput({
  value,
  onChange,
  placeholder = "Enter your text here...",
  isGenerating = false,
  isPlaying = false,
  character = 'lumi',
  disabled = false
}: AnimatedTextInputProps) {
  const [animationPhase, setAnimationPhase] = useState(0);
  const [glowIntensity, setGlowIntensity] = useState(0);

  // Animation phases for different states
  useEffect(() => {
    if (isGenerating) {
      // Rapid animation during generation
      const interval = setInterval(() => {
        setAnimationPhase(prev => (prev + 1) % 6);
        setGlowIntensity(Math.sin(Date.now() * 0.01) * 0.5 + 0.5);
      }, 500);
      return () => clearInterval(interval);
    } else if (isPlaying) {
      // Slower animation during playback
      const interval = setInterval(() => {
        setAnimationPhase(prev => (prev + 1) % 4);
        setGlowIntensity(Math.sin(Date.now() * 0.005) * 0.3 + 0.7);
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setAnimationPhase(0);
      setGlowIntensity(0);
    }
  }, [isGenerating, isPlaying]);

  // Character-specific styling
  const getCharacterStyles = () => {
    const baseStyles = 'transition-all duration-1000 border-2';
    
    if (isGenerating) {
      const generatingStyles = {
        lumi: 'border-purple-400 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg shadow-purple-200/50',
        spark: 'border-orange-400 bg-gradient-to-r from-orange-50 to-yellow-50 shadow-lg shadow-orange-200/50',
        bella: 'border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg shadow-blue-200/50'
      };
      return `${baseStyles} ${generatingStyles[character as keyof typeof generatingStyles] || generatingStyles.lumi}`;
    }
    
    if (isPlaying) {
      const playingStyles = {
        lumi: 'border-purple-300 bg-gradient-to-r from-purple-100/50 to-pink-100/50 shadow-md shadow-purple-100/30',
        spark: 'border-orange-300 bg-gradient-to-r from-orange-100/50 to-yellow-100/50 shadow-md shadow-orange-100/30',
        bella: 'border-blue-300 bg-gradient-to-r from-blue-100/50 to-indigo-100/50 shadow-md shadow-blue-100/30'
      };
      return `${baseStyles} ${playingStyles[character as keyof typeof playingStyles] || playingStyles.lumi}`;
    }
    
    return `${baseStyles} border-gray-300 bg-white/80 backdrop-blur-sm hover:border-purple-300 focus:border-purple-500`;
  };

  // Dynamic glow effects
  const getGlowEffect = () => {
    if (!isGenerating && !isPlaying) return '';
    
    const glowColors = {
      lumi: `shadow-lg shadow-purple-400/${Math.floor(glowIntensity * 40)}`,
      spark: `shadow-lg shadow-orange-400/${Math.floor(glowIntensity * 40)}`,
      bella: `shadow-lg shadow-blue-400/${Math.floor(glowIntensity * 40)}`
    };
    
    return glowColors[character as keyof typeof glowColors] || glowColors.lumi;
  };

  // Floating particles during generation
  const renderFloatingParticles = () => {
    if (!isGenerating && !isPlaying) return null;
    
    const particles = {
      lumi: ['✨', '🌟', '💫'],
      spark: ['🔥', '⚡', '💥'],
      bella: ['💎', '🌊', '💙']
    };
    
    const characterParticles = particles[character as keyof typeof particles] || particles.lumi;
    
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {characterParticles.map((particle, index) => (
          <div
            key={index}
            className="absolute text-xs opacity-60 animate-bounce"
            style={{
              left: `${20 + (index * 30)}%`,
              top: `${10 + (index * 20)}%`,
              animationDelay: `${index * 0.5}s`,
              animationDuration: `${2 + index}s`
            }}
          >
            {particle}
          </div>
        ))}
      </div>
    );
  };

  // Status indicator
  const renderStatusIndicator = () => {
    if (isGenerating) {
      return (
        <div className="absolute top-2 right-2 flex items-center space-x-1">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      );
    }
    
    if (isPlaying) {
      return (
        <div className="absolute top-2 right-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="relative">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`min-h-[120px] resize-none ${getCharacterStyles()} ${getGlowEffect()}`}
        style={{
          transform: isGenerating ? `scale(${1 + Math.sin(Date.now() * 0.01) * 0.02})` : 'scale(1)',
          transition: 'all 0.5s ease-in-out'
        }}
      />
      
      {renderFloatingParticles()}
      {renderStatusIndicator()}
      
      {/* Character-specific border animation */}
      {(isGenerating || isPlaying) && (
        <div className="absolute inset-0 rounded-md pointer-events-none">
          <div 
            className="absolute inset-0 rounded-md border-2 border-transparent animate-shimmer"
            style={{
              background: `linear-gradient(45deg, transparent 30%, rgba(147, 51, 234, 0.3) 50%, transparent 70%)`,
              backgroundSize: '200% 200%',
              transform: `rotate(${animationPhase * 60}deg)`
            }}
          />
        </div>
      )}
    </div>
  );
}
