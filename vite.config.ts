import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(async ({ command, mode }) => {  // Made the function async
  // Load env files
  const env = loadEnv(mode, process.cwd(), '');
  
  // Validate Supabase configuration
  const hasSupabase = !!(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY);
  console.log('Vite Config - Supabase Status:', {
    hasUrl: !!env.VITE_SUPABASE_URL,
    hasKey: !!env.VITE_SUPABASE_ANON_KEY,
    isConfigured: hasSupabase
  });

  const cartographer = process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
    ? [(await import("@replit/vite-plugin-cartographer")).cartographer()]
    : [];

  return {
    define: {
      // Expose environment variables to the client
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
    },
    plugins: [
      react(),
      runtimeErrorOverlay(),
      ...cartographer,
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
