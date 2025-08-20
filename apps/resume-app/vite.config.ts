import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001, // Or any available port
  },
  // Resolve absolute paths for imports starting from src
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
