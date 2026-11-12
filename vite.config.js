import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all addresses (0.0.0.0) for Docker support
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true, // For reliable hot reload inside containers
    },
  },
  preview: {
    host: true,
    port: 5173,
  },
});

