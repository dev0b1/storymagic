# Audio Asset Placeholders Index

This file tracks the placeholder files created for the StoryMagic AI audio system, specifically for the doc_theatre narration mode.

## Status: PLACEHOLDERS ONLY
All audio files listed below are currently **placeholder files** containing specifications and requirements. **No actual audio assets exist yet.**

## Required Audio Assets

### Sound Effects (`/sfx/`)
- `interruption.mp3` - Speaker interruption cues (0.2-0.5s, -20dB to -16dB)
- `overlap.mp3` - Overlapping speech moments (0.3-0.8s, -22dB to -18dB)  
- `transition.mp3` - Scene/topic transitions (1-2s, -18dB to -15dB)
- `emphasis.mp3` - Emphasized words/dramatic moments (0.5-1s, -20dB to -17dB)
- `speaker_change.mp3` - Smooth speaker transitions (0.2-0.4s, -24dB to -20dB)

### Ambient Backgrounds (`/ambient/`)
- `studio.mp3` - Professional podcast studio ambience (60s+ loop, -30dB to -25dB)
- `forest.mp3` - Nature sounds for forest-themed content (60s+ loop, -28dB to -23dB)

### Background Music (`/backgrounds/`)
- `doc_theatre.mp3` - Cinematic documentary-style music (2-5min loop, -25dB to -20dB)
- `focus.mp3` - Calm, professional music for focus mode (seamless loop, -28dB to -23dB)
- `balanced.mp3` - Natural, warm music for guide mode (seamless loop, -26dB to -21dB)
- `engaging.mp3` - Dynamic, exciting music for storyteller mode (seamless loop, -24dB to -19dB)

## Integration Points

### Server Integration (`server/routes.ts`)
The `enhancePodcastScript` function generates cues that reference these audio files:
- `[SFX: interruption]` → `interruption.mp3`
- `[SFX: overlap]` → `overlap.mp3`
- `[SFX: transition]` → `transition.mp3`
- `[SFX: emphasis]` → `emphasis.mp3`
- `[SFX: speaker_change]` → `speaker_change.mp3`

### Audio Profile Integration
The `doc_theatre` sound profile in `soundProfiles` and `dynamicProfiles` expects:
- Rich frequency range for professional podcast feel
- Studio ambience background
- Dramatic background music capability

## Next Steps

1. **Create/Source Audio Files**: Replace placeholder files with actual MP3/WAV audio
2. **Volume Normalization**: Ensure all files meet specified dB levels
3. **Loop Testing**: Verify background/ambient files loop seamlessly  
4. **Quality Control**: Test audio mixing with TTS voices
5. **Integration Testing**: Validate SFX cues trigger correctly in doc_theatre mode

## File Requirements Summary
- **Format**: MP3 (preferred) or WAV
- **Quality**: 128kbps minimum, 320kbps for background music
- **Size**: Under 5MB per file for performance
- **Licensing**: Royalty-free or properly licensed
- **Volume**: Normalized to specified dB ranges
- **Looping**: Background/ambient files must loop seamlessly

## Audio Sources (Suggestions)
- **Free**: Freesound.org, YouTube Audio Library, BBC Sound Effects
- **Paid**: AudioJungle, PremiumBeat, Epidemic Sound
- **AI Generated**: AIVA, Amper Music, Soundful
- **Custom**: Record/synthesize specific sounds for unique requirements

---
*Created: $(date)*  
*Last Updated: $(date)*  
*Status: Placeholder files created, awaiting actual audio assets*
