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
  
  // Lemon Squeezy Configuration
  lemonSqueezyApiKey: process.env.LEMONSQUEEZY_API_KEY || 'your_lemonsqueezy_api_key_here',
  lemonSqueezyStoreId: process.env.LEMONSQUEEZY_STORE_ID || 'your_store_id_here',
  lemonSqueezyVariantId: process.env.LEMONSQUEEZY_VARIANT_ID || 'your_variant_id_here',
  lemonSqueezyWebhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET || 'your_webhook_secret_here',
  
  // Client URLs
  clientUrl: process.env.CLIENT_URL || process.env.VITE_CLIENT_URL || 'http://localhost:5173',
  
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
    lemonSqueezy: config.lemonSqueezyApiKey && config.lemonSqueezyApiKey !== 'your_lemonsqueezy_api_key_here',
  };
};
