import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs"; // Add this import
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(async ({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const hasSupabase = !!(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY);

  const cartographer = process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
    ? [(await import("@replit/vite-plugin-cartographer")).cartographer()]
    : [];

  return {
    define: {
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
    },
    plugins: [
      react(),
      runtimeErrorOverlay(),
      // Remove basicSsl() plugin
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
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        '@supabase/supabase-js',
        '@tanstack/react-query',
        'wouter',
        'lucide-react',
        'clsx',
        'tailwind-merge'
      ],
      exclude: ['@replit/vite-plugin-cartographer']
    },
    server: {
      host: 'localhost',
      port: 5173,
      strictPort: true,
      https: {
        key: fs.readFileSync('localhost-key.pem'), // Use mkcert key
        cert: fs.readFileSync('localhost.pem')     // Use mkcert cert
      },
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
      proxy: {
        '^/api/.*': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          timeout: 10000,
          proxyTimeout: 10000
        },
      },
      hmr: {
        port: 5173,
        host: 'localhost'
      }
    },
  };
});