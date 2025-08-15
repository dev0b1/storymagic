import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { config, hasValidApiKeys } from './config.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = config.port;

// Log configuration status on startup
console.log('🚀 StoryMagic AI Server Starting...');
console.log('=====================================');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envExists = fs.existsSync(envPath);
console.log(`📁 .env file: ${envExists ? '✅ Found' : '❌ Not found'}`);

if (envExists) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    console.log(`📋 Environment variables loaded: ${lines.length}`);
    
        // Check specific API keys
    const hasKeys = hasValidApiKeys();
    console.log(`🔑 OpenRouter API: ${hasKeys.openRouter ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`🎵 ElevenLabs API: ${hasKeys.elevenLabs ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`🤖 OpenAI API: ${hasKeys.openAI ? '✅ Configured' : '❌ Not configured'}`);
    
    // Initialize database
    console.log('\n🗄️ Checking database...');
    import('./supabase.js').then(async ({ db }) => {
      const isValid = await db.validateDatabase();
      if (!isValid) {
        console.log('🛠️ Setting up database...');
        await db.setupDatabase();
      }
    }).catch(error => {
      console.error('❌ Database initialization failed:', error);
    });
  } catch (error) {
    console.log('❌ Error reading .env file:', error instanceof Error ? error.message : String(error));
  }
} else {
  console.log('💡 Tip: Create a .env file with your API keys');
}

console.log(`🌐 Server will start on port: ${PORT}`);
console.log('=====================================\n');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 3000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = PORT; // Use config port instead of process.env.PORT
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📱 Frontend: http://localhost:${port}`);
    console.log(`🔌 API: http://localhost:${port}/api`);
  });

})();
