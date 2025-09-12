// Configuration for Next.js API routes
export const config = {
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
  openAiApiKey: process.env.OPENAI_API_KEY,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  databaseUrl: process.env.DATABASE_URL,
  cartesiaApiKey:process.env.CARTESIA_API_KEY,
};

export function hasValidApiKeys() {
  return {
    openRouter: !!(config.openRouterApiKey && !config.openRouterApiKey.includes('your_key')),
    elevenLabs: !!(config.elevenLabsApiKey && !config.elevenLabsApiKey.includes('your_key')),
    openAI: !!(config.openAiApiKey && !config.openAiApiKey.includes('your_key')),
    supabase: !!(config.supabaseUrl && config.supabaseServiceRoleKey && 
                !config.supabaseUrl.includes('your-project') && 
                !config.supabaseServiceRoleKey.includes('your_key')),
    cartesian: !!(config.cartesiaApiKey && !config.cartesiaApiKey.includes('your_key')), 
  };
}

// StudyFlow configuration
export const studyModes = {
  flashcards: {
    name: "Flashcards",
    description: "Interactive question-answer pairs",
    icon: "🎯",
    style: "Generate clear, concise flashcards that test understanding of key concepts from the document."
  },
  summary: {
    name: "Summary", 
    description: "Key points and concepts",
    icon: "📝",
    style: "Create comprehensive summaries that highlight the most important information from the document."
  },
  quiz: {
    name: "Quiz",
    description: "Multiple choice questions",
    icon: "❓", 
    style: "Generate multiple choice questions that test comprehension of the material."
  }
};

// Generate flashcards from text content
export function generateFlashcardPrompt(): string {
  return `You are an expert educational content creator specializing in creating effective flashcards for studying.

Your task is to analyze the provided text and create high-quality flashcards that will help students learn and retain the information effectively.

For each flashcard, create:
1. A clear, concise question on the front
2. A comprehensive, accurate answer on the back
3. An optional hint that provides a clue without giving away the answer
4. A difficulty level (easy, medium, hard)
5. A relevant category/topic

Guidelines:
- Focus on key concepts, definitions, facts, and important details
- Make questions specific and testable
- Ensure answers are accurate and complete
- Use clear, simple language appropriate for the target audience
- Create a variety of question types (definition, explanation, application, etc.)
- Avoid trivial or overly obvious questions
- Ensure each flashcard tests meaningful understanding

Generate 5-10 high-quality flashcards from the following content:`;
}
