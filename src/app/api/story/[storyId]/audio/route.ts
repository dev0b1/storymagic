import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-service';
import { requireSupabaseUser } from '@/lib/server-auth';
import { config, hasValidApiKeys } from '@/lib/config';

export async function POST(
  req: Request,
  { params }: { params: { storyId: string } }
) {
  try {
    const user = await requireSupabaseUser(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { storyId } = params;
    const url = new URL(req.url);
    const withMusic = url.searchParams.get('withMusic') === 'true';

    if (!storyId) {
      return NextResponse.json({ message: 'Story ID is required' }, { status: 400 });
    }

    console.log('🎵 Audio generation request for story:', storyId);

    // Get the story from database
    const userStories = await DatabaseService.getUserStories(user.id, 100);
    const story = userStories.find(s => s.id === storyId);

    if (!story) {
      return NextResponse.json({ message: 'Story not found' }, { status: 404 });
    }

    // Check if user has access to this story
    if (story.user_id !== user.id) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Check API keys
    const apiKeys = hasValidApiKeys();
    if (!apiKeys.elevenLabs) {
      console.log('⚠️ ElevenLabs API key not configured, using browser TTS');
      return NextResponse.json({ 
        audioUrl: 'browser-tts',
        message: 'Using browser text-to-speech (ElevenLabs not configured)'
      });
    }

    // Generate audio using ElevenLabs
    try {
      const elevenLabsResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB', {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': config.elevenLabsApiKey!
        },
        body: JSON.stringify({
          text: story.output_story,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!elevenLabsResponse.ok) {
        const errorText = await elevenLabsResponse.text();
        console.error('❌ ElevenLabs API error:', elevenLabsResponse.status, errorText);
        throw new Error(`ElevenLabs API error: ${elevenLabsResponse.status}`);
      }

      // Convert audio to base64 for client
      const audioBuffer = await elevenLabsResponse.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');
      const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

      console.log('✅ Audio generated successfully');
      return NextResponse.json({ 
        audioUrl,
        message: 'Audio generated successfully'
      });

    } catch (elevenLabsError) {
      console.error('❌ ElevenLabs error:', elevenLabsError);
      
      // Fallback to browser TTS
      return NextResponse.json({ 
        audioUrl: 'browser-tts',
        message: 'Using browser text-to-speech (ElevenLabs failed)'
      });
    }

  } catch (error) {
    console.error('Audio generation error:', error);
    return NextResponse.json({ 
      message: error instanceof Error ? error.message : 'Failed to generate audio'
    }, { status: 500 });
  }
}
