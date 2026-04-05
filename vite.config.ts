import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
    proxy: {
      '/api/proxy': {
        target: 'http://localhost', // Fallback
        changeOrigin: true,
        router: (req) => {
          try {
            const queryIndex = req.url?.indexOf('?');
            if (queryIndex !== -1) {
              const urlParams = new URLSearchParams(req.url?.substring(queryIndex! + 1));
              const targetUrl = urlParams.get('url');
              if (targetUrl) {
                const urlObj = new URL(targetUrl);
                return urlObj.origin;
              }
            }
          } catch (e) {
            console.error('Proxy Router Error:', e);
          }
          return 'http://localhost';
        },
        rewrite: (path) => {
          try {
            const queryIndex = path.indexOf('?');
            if (queryIndex !== -1) {
              const urlParams = new URLSearchParams(path.substring(queryIndex + 1));
              const targetUrl = urlParams.get('url');
              if (targetUrl) {
                const urlObj = new URL(targetUrl);
                return urlObj.pathname + urlObj.search;
              }
            }
          } catch (e) {
             console.error('Proxy Rewrite Error:', e);
          }
          return path;
        }
      }
    }
  }
});