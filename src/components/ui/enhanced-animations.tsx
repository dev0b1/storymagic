import { useEffect, useRef, useState } from 'react';

interface EnhancedAnimationProps {
  isActive: boolean;
  character: string;
  type: 'generation' | 'playback' | 'idle';
}

export function EnhancedAnimation({ isActive, character, type }: EnhancedAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
  }>>([]);

  // Character-specific animation themes
  const animationThemes = {
    lumi: {
      colors: ['#8B5CF6', '#EC4899', '#F59E0B'],
      particles: ['✨', '🌟', '💫'],
      movement: 'gentle',
      density: 15
    },
    spark: {
      colors: ['#F97316', '#EF4444', '#F59E0B'],
      particles: ['🔥', '⚡', '💥'],
      movement: 'energetic',
      density: 20
    },
    bella: {
      colors: ['#3B82F6', '#8B5CF6', '#06B6D4'],
      particles: ['💎', '🌊', '💙'],
      movement: 'flowing',
      density: 12
    }
  };

  const theme = animationThemes[character as keyof typeof animationThemes] || animationThemes.lumi;

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const initParticles = () => {
      const newParticles = [];
      for (let i = 0; i < theme.density; i++) {
        newParticles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * (theme.movement === 'energetic' ? 3 : 1),
          vy: (Math.random() - 0.5) * (theme.movement === 'energetic' ? 3 : 1),
          life: Math.random() * 100,
          maxLife: 100 + Math.random() * 50,
          color: theme.colors[Math.floor(Math.random() * theme.colors.length)],
          size: 2 + Math.random() * 4
        });
      }
      setParticles(newParticles);
    };

    initParticles();

    // Animation loop
    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      setParticles(prevParticles => 
        prevParticles.map(particle => {
          // Update position
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.life += 1;

          // Bounce off edges
          if (particle.x <= 0 || particle.x >= canvas.width) particle.vx *= -1;
          if (particle.y <= 0 || particle.y >= canvas.height) particle.vy *= -1;

          // Reset particle if it dies
          if (particle.life >= particle.maxLife) {
            return {
              x: Math.random() * canvas.width,
              y: Math.random() * canvas.height,
              vx: (Math.random() - 0.5) * (theme.movement === 'energetic' ? 3 : 1),
              vy: (Math.random() - 0.5) * (theme.movement === 'energetic' ? 3 : 1),
              life: 0,
              maxLife: 100 + Math.random() * 50,
              color: theme.colors[Math.floor(Math.random() * theme.colors.length)],
              size: 2 + Math.random() * 4
            };
          }

          // Draw particle
          const alpha = 1 - (particle.life / particle.maxLife);
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          return particle;
        })
      );

      // Draw connecting lines between nearby particles
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 50) {
            const alpha = (50 - distance) / 50 * 0.3;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = theme.colors[0];
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.restore();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [isActive, character, theme]);

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ 
          background: 'transparent',
          mixBlendMode: 'screen'
        }}
      />
      
      {/* Overlay sparkles for extra magic */}
      <div className="absolute inset-0">
        {theme.particles.map((particle, index) => (
          <div
            key={index}
            className="absolute text-lg animate-pulse"
            style={{
              left: `${20 + (index * 30)}%`,
              top: `${10 + (index * 20)}%`,
              animationDelay: `${index * 0.5}s`,
              animationDuration: `${2 + index}s`,
              color: theme.colors[index % theme.colors.length]
            }}
          >
            {particle}
          </div>
        ))}
      </div>
    </div>
  );
}

// 3D Floating Elements Component
export function Floating3DElements({ isActive, character }: { isActive: boolean; character: string }) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setRotation(prev => (prev + 1) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive) return null;

  const elements = {
    lumi: ['🦉', '📚', '✨'],
    spark: ['🦊', '⚔️', '🔥'],
    bella: ['🤖', '💎', '🌊']
  };

  const characterElements = elements[character as keyof typeof elements] || elements.lumi;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {characterElements.map((element, index) => (
        <div
          key={index}
          className="absolute text-2xl animate-bounce"
          style={{
            left: `${25 + (index * 25)}%`,
            top: `${20 + (index * 20)}%`,
            animationDelay: `${index * 0.3}s`,
            animationDuration: `${3 + index * 0.5}s`,
            transform: `rotateY(${rotation + index * 120}deg) rotateX(${rotation * 0.5}deg)`,
            transformStyle: 'preserve-3d',
            perspective: '1000px'
          }}
        >
          {element}
        </div>
      ))}
    </div>
  );
}

// Wave Effect Component
export function WaveEffect({ isActive, character }: { isActive: boolean; character: string }) {
  const [waveOffset, setWaveOffset] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setWaveOffset(prev => (prev + 2) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg
        className="absolute bottom-0 w-full h-16"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <path
          d={`M 0 60 Q 300 ${60 + Math.sin(waveOffset * Math.PI / 180) * 20} 600 60 Q 900 ${60 + Math.sin((waveOffset + 180) * Math.PI / 180) * 20} 1200 60 L 1200 120 L 0 120 Z`}
          fill="url(#waveGradient)"
          opacity="0.3"
        />
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#EC4899" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
