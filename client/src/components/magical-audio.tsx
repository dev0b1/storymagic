import { useRef, useEffect } from 'react';

interface MagicalAudioProps {
  isPlaying: boolean;
  volume?: number;
  character?: string;
}

export function MagicalAudio({ isPlaying, volume = 0.2, character = 'lumi' }: MagicalAudioProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainNodesRef = useRef<GainNode[]>([]);
  const lfoRef = useRef<OscillatorNode | null>(null);

  // Character-specific ambient sound profiles
  const characterProfiles = {
    lumi: {
      frequencies: [220, 330, 440], // Warm, gentle tones
      volume: 0.15,
      modulation: 0.3
    },
    spark: {
      frequencies: [440, 550, 660], // Bright, energetic tones
      volume: 0.2,
      modulation: 0.5
    },
    bella: {
      frequencies: [196, 293, 392], // Soft, melodic tones
      volume: 0.12,
      modulation: 0.2
    }
  };

  const profile = characterProfiles[character as keyof typeof characterProfiles] || characterProfiles.lumi;

  useEffect(() => {
    const createMagicalAmbience = async () => {
      try {
        // Create Audio Context if not exists
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        // Resume context if suspended
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }

        // Create multiple oscillators for richer sound
        profile.frequencies.forEach((freq, index) => {
          const oscillator = audioContextRef.current!.createOscillator();
          const gainNode = audioContextRef.current!.createGain();
        
        // Connect nodes
        oscillator.connect(gainNode);
          gainNode.connect(audioContextRef.current!.destination);
        
          // Set frequency and type
          oscillator.frequency.setValueAtTime(freq, audioContextRef.current!.currentTime);
        oscillator.type = 'sine';
        
          // Set volume with slight variation per oscillator
          const baseVolume = profile.volume * volume;
          const volumeVariation = baseVolume * (0.8 + (index * 0.2));
          gainNode.gain.setValueAtTime(volumeVariation, audioContextRef.current!.currentTime);
          
          oscillatorsRef.current.push(oscillator);
          gainNodesRef.current.push(gainNode);
        });

        // Create LFO for subtle modulation
        lfoRef.current = audioContextRef.current.createOscillator();
        const lfoGain = audioContextRef.current.createGain();
        lfoRef.current.frequency.setValueAtTime(0.3, audioContextRef.current.currentTime); // Very slow modulation
        lfoGain.gain.setValueAtTime(profile.modulation, audioContextRef.current.currentTime);
        lfoRef.current.connect(lfoGain);
        
        // Apply modulation to all oscillators
        oscillatorsRef.current.forEach(osc => {
          lfoGain.connect(osc.frequency);
        });

        // Start all oscillators
        oscillatorsRef.current.forEach(osc => osc.start());
        lfoRef.current.start();

      } catch (error) {
        console.log('Web Audio API not supported or blocked:', error);
      }
    };

    const stopMagicalAmbience = () => {
      try {
        oscillatorsRef.current.forEach(osc => {
          try {
            osc.stop();
          } catch (e) {
            // Oscillator already stopped
          }
        });
        if (lfoRef.current) {
          try {
            lfoRef.current.stop();
          } catch (e) {
            // LFO already stopped
          }
        }
        oscillatorsRef.current = [];
        gainNodesRef.current = [];
        lfoRef.current = null;
      } catch (error) {
        console.log('Error stopping audio:', error);
      }
    };

    if (isPlaying) {
      createMagicalAmbience();
    } else {
      stopMagicalAmbience();
    }

    return () => {
      stopMagicalAmbience();
    };
  }, [isPlaying, volume, character, profile]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        oscillatorsRef.current.forEach(osc => {
          try {
            osc.stop();
          } catch (e) {
            // Ignore cleanup errors
          }
        });
        if (lfoRef.current) {
          try {
            lfoRef.current.stop();
          } catch (e) {
            // Ignore cleanup errors
          }
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        } catch (error) {
          // Ignore cleanup errors
      }
    };
  }, []);

  return null; // This component doesn't render anything visible
}