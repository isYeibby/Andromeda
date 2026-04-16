import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// PROXY_TARGET is set by docker-compose for container networking.
// Falls back to 127.0.0.1:3001 for local dev without Docker.
const proxyTarget = process.env.PROXY_TARGET || 'http://127.0.0.1:3001';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
      '/auth': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
});
