import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-service';
import { requireSupabaseUser } from '@/lib/server-auth';
import { config, hasValidApiKeys, generateAdaptivePrompt } from '@/lib/config';

export async function POST(req: Request) {
  try {
    const user = await requireSupabaseUser(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null) as { inputText?: string; narrationMode?: string } | null;
    const inputText = body?.inputText?.trim();
    const narrationMode = (body?.narrationMode || 'balanced') as 'focus' | 'balanced' | 'engaging' | 'doc_theatre';

    if (!inputText) {
      return NextResponse.json({ message: 'Input text is required' }, { status: 400 });
    }

    console.log('📝 Story generation request from user:', user.id);
    console.log('👤 Narration mode:', narrationMode);

    // Get user to check limits
    const dbUser = await DatabaseService.getUser(user.id);
    const isPremium = dbUser?.is_premium || false;
    
    // Text length limits
    const maxLength = isPremium ? 20000 : 600;
    if (inputText.length > maxLength) {
      return NextResponse.json({ 
        message: `Text too long. ${isPremium ? 'Premium' : 'Free'} users are limited to ${maxLength} characters. Your text is ${inputText.length} characters.` 
      }, { status: 400 });
    }
    
    // Check story limits for non-premium users
    if (dbUser) {
      const storiesCount = dbUser.stories_generated || 0;
      
      if (!isPremium && storiesCount >= 10) {
        return NextResponse.json({ 
          message: 'Free users are limited to 10 stories. Upgrade to premium for unlimited stories!',
          code: 'LIMIT_REACHED'
        }, { status: 403 });
      }
    }
    
    // Create enhanced system prompt with narration mode
    const systemPrompt = generateAdaptivePrompt(narrationMode);

    let generatedStory: string | null = null;

    // Try OpenRouter API
    try {
      const apiKeys = hasValidApiKeys();
      if (!apiKeys.openRouter) {
        throw new Error('OpenRouter API key not configured. Please set OPENROUTER_API_KEY environment variable.');
      }

      const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
          'X-Title': 'StoryMagic AI'
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-small-3.2-24b-instruct:free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `User input: "${inputText}"` }
          ],
          max_tokens: 800,
          temperature: 0.7
        })
      });

      if (openRouterResponse.ok) {
        const openRouterData = await openRouterResponse.json();
        generatedStory = openRouterData.choices?.[0]?.message?.content;
        
        if (generatedStory && generatedStory.trim().length > 0) {
          console.log('✅ OpenRouter API successful, story generated');
        } else {
          throw new Error('Empty response from OpenRouter API');
        }
      } else {
        const errorData = await openRouterResponse.text();
        console.error('❌ OpenRouter API error:', openRouterResponse.status, errorData);
        throw new Error(`OpenRouter API error: ${openRouterResponse.status}`);
      }
    } catch (openRouterError) {
      console.error('❌ OpenRouter API failed:', openRouterError);
      console.error('💡 Please ensure your OPENROUTER_API_KEY is correctly configured');
      
      return NextResponse.json({ 
        message: 'Story generation failed. Please check your OpenRouter API key configuration.',
        error: openRouterError instanceof Error ? openRouterError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Save story and update count
    console.log('💾 Saving story for user:', user.id);
    
    const saved = await DatabaseService.createStory({
      user_id: user.id,
      input_text: inputText,
      output_story: generatedStory!,
      narration_mode: narrationMode,
      source: 'api'
    });
    
    console.log('✅ Story saved with ID:', saved?.id);
    
    // Update user's story count
    if (dbUser) {
      const newCount = (dbUser.stories_generated || 0) + 1;
      await DatabaseService.updateUser(user.id, { stories_generated: newCount });
    }

    return NextResponse.json({
      story: generatedStory,
      narrationMode,
      storyId: saved?.id,
      savedStory: saved,
    });

  } catch (error) {
    console.error('Story generation error:', error);
    return NextResponse.json({ 
      message: error instanceof Error ? error.message : 'Failed to generate story' 
    }, { status: 500 });
  }
}


