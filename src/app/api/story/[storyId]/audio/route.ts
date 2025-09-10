import { NextResponse } from "next/server";
import { DatabaseService } from "@/lib/database-service";
import { requireSupabaseUser, supabaseAdmin } from "@/lib/server-auth";
import { config, hasValidApiKeys } from "@/lib/config";
import { eq } from "drizzle-orm";
import { stories } from "@shared/schema";
import { db } from "@/lib/db";
import { CartesiaClient } from "@cartesia/cartesia-js";

// ✅ Convert response to Buffer (supports fetch responses or raw bytes)
const generateAudioUrl = async (response: any) => {
  if (response?.arrayBuffer) {
    const audioBuffer = await response.arrayBuffer();
    return Buffer.from(audioBuffer);
  }
  return Buffer.from(response); // handles Uint8Array or Buffer
};

// ✅ Cartesian TTS wrapper
const cartesianAudio = async (data: string) => {
  const apiKeys = hasValidApiKeys();
  if (!apiKeys.cartesian) {
    throw new Error("Cartesian API key not configured");
  }

  const client = new CartesiaClient({
    apiKey: process.env.CARTESIA_API_KEY!,
  });

  // Call Cartesia API
  const response = await client.tts.bytes({
    modelId: "sonic-2",
    voice: {
      mode: "id",
      id: "694f9389-aac1-45b6-b726-9d9369183238",
    },
    outputFormat: {
      container: "mp3", // 🔄 match your Supabase upload type
      sampleRate: 44100,
      bitRate: 192000,
    },
    transcript: data,
  });

  return response;
};

// ✅ POST request handler
export async function POST(
  req: Request,
  { params }: { params: Promise<{ storyId: string }> } // 👈 must be Promise
) {
  try {
    // Ensure the user is logged in
    const user = await requireSupabaseUser(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { storyId } = await params; // 👈 await here
    if (!storyId) {
      return NextResponse.json(
        { message: "Story ID is required" },
        { status: 400 }
      );
    }

    console.log("🎵 Audio generation request for story:", storyId);

    // Load the story
    const userStories = await DatabaseService.getUserStories(user.id, 100);
    const story = userStories.find((s) => s.id === storyId);

    if (!story) {
      return NextResponse.json({ message: "Story not found" }, { status: 404 });
    }

    // Ensure user owns this story
    if (story.user_id !== user.id) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    // Check API keys
    const apiKeys = hasValidApiKeys();
    if (!apiKeys.elevenLabs) {
      console.log("⚠️ ElevenLabs API key not configured, using browser TTS");
      return NextResponse.json({
        audioUrl: "browser-tts",
        message: "Using browser text-to-speech (ElevenLabs not configured)",
      });
    }


    // Generate audio using ElevenLabs
    const elevenLabsResponse = await fetch(
      "https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB",
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": config.elevenLabsApiKey!,
        },
        body: JSON.stringify({
          text: story.output_story,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    let audioFile;

    if (!elevenLabsResponse.ok) {
      console.warn("⚠️ ElevenLabs TTS failed, falling back to Cartesian TTS");
      try {
        const cartesianResponse = await cartesianAudio(story.output_story);
        audioFile = await generateAudioUrl(cartesianResponse);
      } catch (error) {
        console.error("❌ Cartesian TTS also failed:", error);
        throw new Error("Both ElevenLabs and Cartesian TTS failed");
      }
    } else {
      audioFile = await generateAudioUrl(elevenLabsResponse);
    }

    // Upload audio file to Supabase Storage under user folder
    const filePath = `stories/${user.id}/${storyId}.mp3`;
    console.log(filePath);
    const { error: uploadError } = await supabaseAdmin.storage
      .from("audios")
      .upload(filePath, audioFile, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("❌ Error uploading audio:", uploadError);
      throw new Error("Failed to upload audio to storage");
    }

    // Get a public URL for playback
    const { data: publicData } = supabaseAdmin.storage
      .from("audios")
      .getPublicUrl(filePath);

    const audioUrl = publicData.publicUrl;

    // Update story with audio_url in DB
    await db
      .update(stories)
      .set({ audio_url: audioUrl })
      .where(eq(stories.id, storyId));

    console.log("✅ Audio generated and saved:", audioUrl);

    return NextResponse.json({
      audioUrl,
      message: "Audio generated successfully",
    });
  } catch (error) {
    console.error("Audio generation error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to generate audio",
      },
      { status: 500 }
    );
  }
}
