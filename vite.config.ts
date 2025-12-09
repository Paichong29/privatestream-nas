import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Cast process to any to avoid TS errors in some environments
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false
    },
    define: {
      // Polyfill process.env for client-side usage (e.g. Google GenAI SDK)
      // This "bakes" the API key into the JS bundle at build time.
      'process.env': {
        API_KEY: JSON.stringify(env.API_KEY || '')
      }
    },
    server: {
      proxy: {
        // Proxy API requests to the Node.js backend during local development
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        }
      }
    }
  };
});