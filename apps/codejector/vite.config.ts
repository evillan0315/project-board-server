import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react(),
      tailwindcss(),],
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
      port: 3001,
      proxy: {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/openvidu/api': {
          target: env.VITE_SLS_VIDU_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/openvidu\/api/, ''),
        },
        '/swingers': {
          target: env.VITE_SLS_API_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/swingers/, ''),
        },
        '/socket.io': {
          target: env.VITE_WS_URL,
          changeOrigin: true,
          ws: true,
        },
      },
      cors: {
        origin: ['*'],
        methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PATCH', 'PUT'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
      },
      allowedHosts: ['app.local','localhost', 'viduk.swinglifestyle.com', 'chatv.swinglifestyle.com'],
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'import.meta.env.GITHUB_CALLBACK_URL': JSON.stringify(
        env.GITHUB_CALLBACK_URL,
      ),
      'import.meta.env.GOOGLE_CALLBACK_URL': JSON.stringify(
        env.GOOGLE_CALLBACK_URL,
      ),
      'import.meta.env.VITE_BACKEND_URL': JSON.stringify(env.VITE_BACKEND_URL),
      'import.meta.env.FRONTEND_URL': JSON.stringify(env.VITE_FRONTEND_URL),
      // Ensure VITE_API_URL and VITE_WS_URL are explicitly defined as string literals for reliable injection
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      'import.meta.env.VITE_WS_URL': JSON.stringify(env.VITE_WS_URL),
      'import.meta.env.VITE_SLS_API_URL': JSON.stringify(env.VITE_SLS_API_URL),
      'import.meta.env.VITE_SLS_VIDU_URL': JSON.stringify(env.VITE_SLS_VIDU_URL),
      'import.meta.env.VITE_SLS_API_KEY': JSON.stringify(env.VITE_SLS_API_KEY),
      'import.meta.env.VITE_SLS_USERNAME': JSON.stringify(env.VITE_SLS_USERNAME),   
    },
  };
});
