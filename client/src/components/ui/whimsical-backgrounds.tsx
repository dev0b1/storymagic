import { useEffect, useState } from 'react';

interface WhimsicalBackgroundProps {
  storyTheme?: string;
  isActive?: boolean;
}

export function WhimsicalBackground({ storyTheme = 'default', isActive = false }: WhimsicalBackgroundProps) {
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; delay: number; size: number }>>([]);

  useEffect(() => {
    // Generate random sparkles
    const newSparkles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
      size: 1 + Math.random() * 2
    }));
    setSparkles(newSparkles);
  }, [storyTheme]);

  // Different background themes based on story content
  const backgrounds = {
    default: 'bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100',
    forest: 'bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100',
    ocean: 'bg-gradient-to-br from-blue-100 via-cyan-50 to-teal-100',
    magical: 'bg-gradient-to-br from-purple-200 via-pink-100 to-violet-100',
    adventure: 'bg-gradient-to-br from-orange-100 via-yellow-50 to-red-100',
    mystery: 'bg-gradient-to-br from-indigo-200 via-purple-100 to-slate-100'
  };

  const selectedBg = backgrounds[storyTheme as keyof typeof backgrounds] || backgrounds.default;

  return (
    <div className={`absolute inset-0 overflow-hidden transition-all duration-1000 ${selectedBg} ${isActive ? 'opacity-100' : 'opacity-60'}`}>
      {/* Floating sparkles */}
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute rounded-full bg-gradient-to-r from-yellow-300 to-pink-400 animate-pulse opacity-70"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            width: `${sparkle.size}px`,
            height: `${sparkle.size}px`,
            animationDelay: `${sparkle.delay}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
      
      {/* Floating bubbles */}
      {isActive && (
        <>
          <div className="absolute top-10 left-10 w-4 h-4 bg-white/30 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0s', animationDuration: '3s' }} />
          <div className="absolute top-20 right-16 w-2 h-2 bg-white/40 rounded-full animate-bounce opacity-50" style={{ animationDelay: '1s', animationDuration: '4s' }} />
          <div className="absolute bottom-20 left-20 w-3 h-3 bg-white/35 rounded-full animate-bounce opacity-55" style={{ animationDelay: '2s', animationDuration: '3.5s' }} />
          <div className="absolute bottom-10 right-10 w-5 h-5 bg-white/25 rounded-full animate-bounce opacity-40" style={{ animationDelay: '0.5s', animationDuration: '5s' }} />
        </>
      )}
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
    </div>
  );
}

export function getStoryTheme(story: string): string {
  const lowerStory = story.toLowerCase();
  
  if (lowerStory.includes('forest') || lowerStory.includes('tree') || lowerStory.includes('nature')) return 'forest';
  if (lowerStory.includes('ocean') || lowerStory.includes('sea') || lowerStory.includes('water')) return 'ocean';
  if (lowerStory.includes('magic') || lowerStory.includes('spell') || lowerStory.includes('wizard')) return 'magical';
  if (lowerStory.includes('adventure') || lowerStory.includes('journey') || lowerStory.includes('quest')) return 'adventure';
  if (lowerStory.includes('mystery') || lowerStory.includes('secret') || lowerStory.includes('hidden')) return 'mystery';
  
  return 'default';
}