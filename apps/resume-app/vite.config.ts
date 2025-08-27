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
      port: 3001,
      proxy: {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },

        '/socket.io': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          ws: true,
        },
      },
      cors: {
        origin: ['*'],
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
      },
      allowedHosts: ['localhost'],
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'import.meta.env.BASE_URL_API': JSON.stringify(env.BASE_URL),
      'import.meta.env.BASE_DIR': JSON.stringify(process.cwd()),
      'import.meta.env.GITHUB_CALLBACK_URL': JSON.stringify(env.GITHUB_CALLBACK_URL),
      'import.meta.env.GOOGLE_CALLBACK_URL': JSON.stringify(env.GOOGLE_CALLBACK_URL),
      'import.meta.env.FRONTEND_URL': JSON.stringify(env.VITE_FRONTEND_URL), // Add frontend URL for backend redirects
    },
  };
});
