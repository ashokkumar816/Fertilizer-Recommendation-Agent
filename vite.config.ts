import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'; // ✅ REQUIRED for Tailwind v4
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // ✅ REQUIRED
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5500', // Your backend port
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});