import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    // Ensure plugins are correctly flattened if they return arrays or for type inference issues
    plugins: [
      react(),
      tailwindcss()
    ].flat().filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
    },
    preview: {
      port: 4173, // Default preview server port
    },
    server: {
      port: 3002,
      proxy: {
        '/api': {
          target: env.VITE_APP_API_BASE_URL,
          changeOrigin: true,
          // Removed rewrite: (path) => path.replace(/^\/api/, ''), to correctly proxy /api calls
        },
      },
      cors: {
        origin: ['*'],
        methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PATCH', 'PUT'],
        allowedHeaders: ['Content-Type', 'Authorization'],       credentials: true,
      },
      allowedHosts:
        [ 
          'app.local',
          'localhost'
        ],
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      // These define statements are only relevant if the frontend code directly uses them. 
      // Current services use relative '/api' paths handled by proxy/rewrites.
      'import.meta.env.GITHUB_CALLBACK_URL': JSON.stringify(env.GITHUB_CALLBACK_URL),
      'import.meta.env.GOOGLE_CALLBACK_URL': JSON.stringify(env.GOOGLE_CALLBACK_URL),
      'import.meta.env.FRONTEND_URL': JSON.stringify(env.VITE_FRONTEND_URL),
      'import.meta.env.VITE_APP_API_BASE_URL': JSON.stringify(env.VITE_APP_API_BASE_URL),
      'import.meta.env.VITE_FRONTEND_PORT': JSON.stringify(env.VITE_FRONTEND_PORT),
    },
  };
});