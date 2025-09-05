// Configuration for Next.js API routes
export const config = {
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
  openAiApiKey: process.env.OPENAI_API_KEY,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  databaseUrl: process.env.DATABASE_URL,
};

export function hasValidApiKeys() {
  return {
    openRouter: !!(config.openRouterApiKey && !config.openRouterApiKey.includes('your_key')),
    elevenLabs: !!(config.elevenLabsApiKey && !config.elevenLabsApiKey.includes('your_key')),
    openAI: !!(config.openAiApiKey && !config.openAiApiKey.includes('your_key')),
    supabase: !!(config.supabaseUrl && config.supabaseServiceRoleKey && 
                !config.supabaseUrl.includes('your-project') && 
                !config.supabaseServiceRoleKey.includes('your_key'))
  };
}

// Professional narration modes
export const narrationModes = {
  focus: {
    name: "Clarity",
    description: "Crystal-clear knowledge delivery",
    icon: "✨",
    style: "Transform complex information into crystal-clear explanations. Like having a brilliant professor who makes everything click. Perfect for technical content, research papers, and detailed learning materials.",
    audioProfile: "precise-expert"
  },
  balanced: {
    name: "Guide", 
    description: "Your friendly knowledge companion",
    icon: "🎯",
    style: "Like having a knowledgeable friend explain things over coffee. Maintains the perfect balance between informative and conversational, making learning feel natural and enjoyable. Ideal for textbooks, articles, and general learning.",
    audioProfile: "friendly-expert"
  },
  engaging: {
    name: "Storyteller",
    description: "Where knowledge meets imagination",
    icon: "💫", 
    style: "Weaves facts into captivating narratives while maintaining accuracy. Brings dry facts to life through engaging storytelling. Perfect for history, case studies, biographies, and making complex topics memorable.",
    audioProfile: "dynamic-narrative"
  }
};

// Generate adaptive prompt for story generation
export function generateAdaptivePrompt(narrationMode: 'focus' | 'balanced' | 'engaging' | 'doc_theatre'): string {
  const mode = narrationModes[narrationMode as keyof typeof narrationModes];
  
  const modeInstructions = {
    focus: `You are an expert lecturer creating a clear, structured audio lesson.

Produce a lecture that:
- Starts with a 1-2 sentence objective (what the listener will learn)
- Breaks content into short, logical sections with concise explanations
- Uses simple examples or analogies where helpful (without inventing facts)
- Summarizes key takeaways at the end

Tone: professional, calm, concise. Do not add information not present in the source.`,

    balanced: `You are a friendly guide explaining the material conversationally.

Produce a guide that:
- Explains concepts plainly with natural transitions
- Balances brevity with clarity, avoids unnecessary fluff
- Keeps the content accurate to the source

Tone: approachable, helpful, focused on clarity without storytelling flourishes.`,

    engaging: `You are a factual narrator crafting an engaging narrative while preserving accuracy.

Produce a narrative that:
- Weaves the material into a flowing story structure (setup → development → concise resolution)
- Uses vivid but precise language that never invents facts
- Emphasizes memorable moments and insights already present in the source

Tone: engaging and professional; do not dramatize beyond the source content.`,
    
    doc_theatre: `You are producing a multi-voice podcast episode (host + 2–3 guests) based strictly on the source.

Produce a podcast script that:
- Includes a Host and 2–3 Guests (assign sensible roles like Researcher, Practitioner, Analyst)
- Alternates speakers with brief, natural interjections; short overlaps can be marked as (overlapping)
- Optionally include subtle cue markers like [SFX: soft_intro] or [BG: studio] where clearly appropriate
- Always remains faithful to the source; never add facts

Tone: natural roundtable conversation, concise and informative.`
  };
  
  return `${modeInstructions[narrationMode as keyof typeof modeInstructions]}

Critical Requirements:
- Transform the content while preserving every important detail
- Never add information that isn't in the original content
- Keep all technical terms, numbers, dates, and proper nouns exactly as given
- Maintain academic/professional language where appropriate
- If something is unclear in the source, keep that ambiguity explicit
- Focus on transformation of style and structure, not content

Critical constraints:
- Do not introduce information that is not explicitly present in the provided input
- Do not guess, speculate, or invent facts
- Preserve terminology, figures, dates, citations, and proper nouns exactly as given
- If the source content is incomplete or ambiguous, keep those gaps explicit in the output
- Maintain the original scope and do not add extra sections or claims

Guidelines:
- Maintain 100% factual accuracy
- Use clear, professional language appropriate for the selected mode
- Create logical flow and structure
- Keep the tone consistent with the selected narration mode

Transform the following content:`;
}
