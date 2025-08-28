// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
    },
    server: {
      port: 3001, // Port for ai-editor-front
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3000', // Default to 3000 for backend
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },

        '/socket.io': {
          target: env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          ws: true,
        },
      },
      cors: {
        origin: ['*'], // Adjust for production environments
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
      },
      allowedHosts: ['localhost'],
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'import.meta.env.GITHUB_CALLBACK_URL': JSON.stringify(env.GITHUB_CALLBACK_URL),
      'import.meta.env.GOOGLE_CALLBACK_URL': JSON.stringify(env.GOOGLE_CALLBACK_URL),
      'import.meta.env.VITE_FRONTEND_URL': JSON.stringify(
        env.VITE_FRONTEND_URL || 'http://localhost:3001',
      ),
      'import.meta.env.VITE_BASE_DIR': JSON.stringify(env.VITE_BASE_DIR || ''),
    },
  };
});
