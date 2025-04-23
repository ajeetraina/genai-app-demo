import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/upload-pdf': 'http://localhost:8080',
      '/chat-with-pdf': 'http://localhost:8080',
      '/list-pdfs': 'http://localhost:8080',
      '/pdf': 'http://localhost:8080',
      '/pdf-text': 'http://localhost:8080',
      '/health': 'http://localhost:8080'
    }
  },
});
