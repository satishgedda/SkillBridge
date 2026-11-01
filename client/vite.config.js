import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        configure(proxy) {
          proxy.on('error', (_error, _request, response) => {
            if (!response.headersSent) {
              response.writeHead(503, { 'Content-Type': 'application/json' });
              response.end(JSON.stringify({ error: 'SkillBridge API is unavailable. Start the backend and check its terminal output.' }));
            }
          });
        },
      },
    },
  },
});
