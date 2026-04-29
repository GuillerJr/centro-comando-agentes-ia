import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('pixi.js')) return 'pixi';
          if (id.includes('react-router-dom')) return 'router';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('node_modules')) return 'vendor';
          return undefined;
        },
      },
    },
  },
});
