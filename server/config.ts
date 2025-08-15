// Server configuration
export const config = {
  // API Keys
  openRouterApiKey: process.env.OPENROUTER_API_KEY || 'your_openrouter_api_key_here',
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY || 'your_elevenlabs_api_key_here',
  openaiApiKey: process.env.OPENAI_API_KEY || 'your_openai_api_key_here',
  
  // Server Configuration
  port: process.env.PORT || 3001, // Changed to 3001 to avoid conflict
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Supabase Configuration
  supabaseUrl: process.env.SUPABASE_URL || 'your_supabase_url_here',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key_here',
  
  // Feature Flags
  enableOpenRouter: process.env.ENABLE_OPENROUTER !== 'false',
  enableElevenLabs: process.env.ENABLE_ELEVENLABS !== 'false',
  enableOpenAI: process.env.ENABLE_OPENAI !== 'false',
};

// Helper function to check if API keys are configured
export const hasValidApiKeys = () => {
  return {
    openRouter: config.openRouterApiKey && config.openRouterApiKey !== 'your_openrouter_api_key_here',
    elevenLabs: config.elevenLabsApiKey && config.elevenLabsApiKey !== 'your_elevenlabs_api_key_here',
    openAI: config.openaiApiKey && config.openaiApiKey !== 'your_openai_api_key_here',
  };
};
