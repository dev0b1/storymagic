import { useRef, useEffect } from 'react';

interface MagicalAudioProps {
  isPlaying: boolean;
  volume?: number;
}

export function MagicalAudio({ isPlaying, volume = 0.2 }: MagicalAudioProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate a simple magical ambient tone using Web Audio API
  useEffect(() => {
    let audioContext: AudioContext;
    let oscillator: OscillatorNode;
    let gainNode: GainNode;

    const createMagicalTone = () => {
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create oscillator for magical tone
        oscillator = audioContext.createOscillator();
        gainNode = audioContext.createGain();
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Set up magical frequency (around 220Hz with subtle variations)
        oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
        oscillator.type = 'sine';
        
        // Very quiet background volume
        gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
        
        // Add subtle frequency modulation for magical effect
        const lfo = audioContext.createOscillator();
        const lfoGain = audioContext.createGain();
        lfo.frequency.setValueAtTime(0.5, audioContext.currentTime); // Slow modulation
        lfoGain.gain.setValueAtTime(10, audioContext.currentTime); // Subtle pitch variation
        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);
        
        if (isPlaying) {
          oscillator.start();
          lfo.start();
        }
        
        return { audioContext, oscillator, gainNode, lfo };
      } catch (error) {
        console.log('Web Audio API not supported, falling back to silent mode');
        return null;
      }
    };

    let audioNodes: ReturnType<typeof createMagicalTone> = null;

    if (isPlaying) {
      audioNodes = createMagicalTone();
    }

    return () => {
      if (audioNodes) {
        try {
          audioNodes.oscillator?.stop();
          audioNodes.lfo?.stop();
          audioNodes.audioContext?.close();
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    };
  }, [isPlaying, volume]);

  return null; // This component doesn't render anything visible
}