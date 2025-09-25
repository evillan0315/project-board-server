
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
  server: {
      port: 3001,
      proxy: {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },

        '/socket.io': {
          target: env.VITE_WS_URL,
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
   };
})
