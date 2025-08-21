# Audio Assets for StoryMagic AI

This folder contains audio assets used by the Doc Theatre mode and background music system.

## Folder Structure

### `/backgrounds/`
Place background music files here:
- `focus.mp3` - Calm, professional background for Focus mode
- `balanced.mp3` - Natural, warm background for Guide mode  
- `engaging.mp3` - Dynamic, exciting background for Storyteller mode
- `doc_theatre.mp3` - Dramatic background for Doc Theatre mode

### `/sfx/`
Place sound effect files here:
- `interruption.mp3` - Sound for voice interruptions
- `overlap.mp3` - Sound for overlapping voices
- `transition.mp3` - Sound for scene transitions
- `emphasis.mp3` - Sound for emphasized words/phrases

### `/ambient/`
Place ambient environment sounds here:
- `forest.mp3` - Nature sounds for forest-themed content
- `ocean.mp3` - Ocean waves for marine content
- `city.mp3` - Urban sounds for business content
- `academic.mp3` - Library/classroom sounds for educational content

## File Requirements

- **Format**: MP3 (preferred) or WAV
- **Quality**: 128kbps minimum, 320kbps recommended
- **Duration**: 30 seconds to 2 minutes (will be looped automatically)
- **Volume**: Normalized to -20dB to -16dB (not too loud)

## Usage in Doc Theatre Mode

The AI will generate scripts with cues like:
- `[SFX: interruption]` - Triggers interruption.mp3
- `[BG: forest]` - Triggers forest.mp3 ambient
- `[SFX: emphasis]` - Triggers emphasis.mp3

## Adding New Sounds

1. Place your audio file in the appropriate folder
2. Update the server code in `server/routes.ts` to reference new files
3. Test with Doc Theatre mode generation

## Audio Processing

The server uses FFmpeg to:
- Mix TTS audio with background music
- Apply sound effects at cue points
- Normalize volume levels
- Convert to MP3 for download

## Production Notes

- Keep file sizes under 5MB for performance
- Use royalty-free or licensed audio
- Test audio mixing with different TTS voices
- Ensure consistent volume levels across all assets

