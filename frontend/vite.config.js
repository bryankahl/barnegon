import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        login: resolve(__dirname, 'login.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        terms: resolve(__dirname, 'terms.html'),
        // REMOVED: subscribe: resolve(__dirname, 'subscribe.html'),
        agent: resolve(__dirname, 'src/agent-v2.js') 
      },
      output: {
        entryFileNames: (assetInfo) => {
          if (assetInfo.name === 'agent') return 'agent-v2.js'; 
          return 'assets/[name]-[hash].js';
        }
      }
    }
  }
});