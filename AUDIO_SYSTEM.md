# StoryMagic Audio System Documentation

## Overview
StoryMagic features a sophisticated audio system that combines AI-powered text-to-speech with dynamic background music and sound effects to create immersive audio experiences.

## Architecture

### 1. TTS (Text-to-Speech) Pipeline
**Priority Chain:**
1. **ElevenLabs** (Premium) - Highest quality, premium users only
2. **OpenAI TTS** (Standard) - High quality, reliable fallback
3. **Browser TTS** (Basic) - Client-side fallback for demos

### 2. Background Music System
**Generated Audio Profiles:**
- **Focus Mode**: Calm, professional ambience (220-440Hz)
- **Balanced Mode**: Natural, warm tones (260-523Hz)
- **Engaging Mode**: Dynamic, energetic frequencies (330-659Hz)
- **Doc Theatre Mode**: Rich podcast studio ambience (180-680Hz)

**Custom Audio Files** (Optional):
```
assets/audio/backgrounds/
├── calm_ambience.mp3      # Focus mode
├── natural_ambience.mp3   # Balanced mode
├── dramatic_ambience.mp3  # Engaging mode
└── studio_ambience.mp3    # Doc Theatre mode
```

### 3. Sound Effects for Doc Theatre Mode
**Automated SFX Insertion:**
- `[SFX: podcast_intro]` - Episode introduction
- `[SFX: speaker_transition]` - Between speakers
- `[SFX: interruption]` - Natural interruptions
- `[SFX: voices_overlap]` - Overlapping speech
- `[SFX: thoughtful_pause]` - Thinking pauses
- `[SFX: emphasis]` - Important points
- `[SFX: topic_transition]` - Section changes
- `[SFX: podcast_outro]` - Episode conclusion

## Audio Mixing Process

### 1. Generation Phase
```javascript
// Estimate audio duration
const wordCount = story.split(' ').length;
const estimatedDuration = Math.ceil(wordCount / 150 * 60); // ~150 WPM

// Generate background music
const backgroundFile = await createDynamicBackgroundMusic(
  estimatedDuration, 
  narrationMode
);
```

### 2. Mixing Phase
```javascript
// Mix TTS with background music using FFmpeg
const mixedFile = await mixAudioWithBackground(ttsFile, backgroundFile);
```

### 3. FFmpeg Commands
**Background Music Generation:**
```bash
ffmpeg -f lavfi -i "sine=frequency=220:duration=120" \
       -f lavfi -i "sine=frequency=330:duration=120" \
       -f lavfi -i "sine=frequency=440:duration=120" \
       -filter_complex "[0:a]volume=0.018[a1];[1:a]volume=0.014[a2];[2:a]volume=0.01[a3];[a1][a2][a3]amix=inputs=3:duration=longest:dropout_transition=2[out]" \
       -map "[out]" -y background.wav
```

**Audio Mixing:**
```bash
ffmpeg -i tts_audio.mp3 -i background.wav \
       -filter_complex "[0:a]volume=1.0[tts];[1:a]volume=0.3[bg];[tts][bg]amix=inputs=2:duration=first:dropout_transition=2" \
       -c:a libmp3lame -b:a 128k -y final_output.mp3
```

## Adding Custom Background Music

### 1. Prepare Audio Files
- **Format**: MP3, WAV, or OGG
- **Duration**: Any (will be looped to match story length)
- **Quality**: 128kbps minimum
- **Volume**: Normalized to prevent clipping

### 2. File Naming Convention
```
assets/audio/backgrounds/
├── focus_ambient.mp3        # Professional, calm
├── balanced_nature.mp3      # Natural, educational
├── engaging_upbeat.mp3      # Dynamic, storytelling
└── podcast_studio.mp3       # Professional podcast
```

### 3. Integration Code
```javascript
const customAudioFiles = {
  focus: path.join(audioPath, 'focus_ambient.mp3'),
  balanced: path.join(audioPath, 'balanced_nature.mp3'),
  engaging: path.join(audioPath, 'engaging_upbeat.mp3'),
  doc_theatre: path.join(audioPath, 'podcast_studio.mp3')
};
```

## Advanced Features

### 1. Dynamic Volume Control
```javascript
const volumeProfiles = {
  focus: { tts: 1.0, background: 0.2 },
  balanced: { tts: 1.0, background: 0.3 },
  engaging: { tts: 0.9, background: 0.4 },
  doc_theatre: { tts: 1.0, background: 0.25 }
};
```

### 2. Frequency-Based EQ
```javascript
const eqSettings = {
  focus: 'highpass=f=100,lowpass=f=8000',
  balanced: 'equalizer=f=1000:width_type=h:width=200:g=2',
  engaging: 'equalizer=f=2000:width_type=h:width=500:g=3',
  doc_theatre: 'highpass=f=80,lowpass=f=10000'
};
```

### 3. Crossfading Between Sections
```javascript
const crossfadeCommand = `
  -filter_complex "
    [0:a]afade=t=out:st=${duration-2}:d=2[fadeout];
    [1:a]afade=t=in:st=0:d=2[fadein];
    [fadeout][fadein]amix=inputs=2[out]
  "
`;
```

## Production Deployment

### 1. Dependencies
```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Docker
FROM ubuntu:20.04
RUN apt-get update && apt-get install -y ffmpeg
```

### 2. Environment Variables
```env
# Audio Processing
ENABLE_BACKGROUND_MUSIC=true
AUDIO_QUALITY=high
MAX_AUDIO_DURATION=600  # 10 minutes

# Custom Audio Path
CUSTOM_AUDIO_PATH=/app/assets/audio/backgrounds

# TTS Settings
ELEVENLABS_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
```

### 3. Performance Optimization
- **Caching**: Cache generated background music
- **Async Processing**: Process audio in background
- **Compression**: Use appropriate bitrates (128kbps for speech)
- **Cleanup**: Auto-delete temporary files after 1 hour

## Troubleshooting

### Common Issues

1. **FFmpeg Not Found**
   - Install FFmpeg system-wide
   - Verify PATH environment variable

2. **Audio Quality Issues**
   - Check TTS API response format
   - Verify mixing volume levels
   - Test with different bitrates

3. **Long Processing Times**
   - Reduce audio quality for development
   - Use shorter background music files
   - Implement audio caching

### Debug Commands
```bash
# Test FFmpeg installation
ffmpeg -version

# Check audio file properties
ffprobe input_audio.mp3

# Generate test background music
ffmpeg -f lavfi -i "sine=frequency=440:duration=10" -y test_background.wav
```

## Future Enhancements

### 1. Real-time Audio Processing
- WebSocket-based streaming
- Progressive audio generation
- Live preview during generation

### 2. AI-Enhanced Sound Design
- Automatic SFX insertion based on content analysis
- Dynamic volume adjustment based on speech patterns
- Genre-specific background music selection

### 3. User Customization
- Upload custom background music
- Adjustable mixing levels
- Personal audio preferences

### 4. Multi-language Support
- Language-specific TTS models
- Cultural background music selection
- Regional sound preferences

## API Reference

### Audio Generation Endpoint
```
POST /api/story/:id/audio?withMusic=true
Headers: x-user-id: string
Response: { audioUrl: string, provider: string }
```

### Background Music Types
- `simple` - Basic sine wave generation
- `dynamic` - Multi-layer complex audio
- `custom` - User-provided audio files

### Supported Audio Formats
- **Input**: MP3, WAV, OGG, M4A
- **Output**: MP3 (128kbps), WAV (16-bit)
- **Streaming**: Base64-encoded for web delivery
