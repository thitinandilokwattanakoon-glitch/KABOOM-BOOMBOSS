import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  // sockjs-client references Node's `global`, which doesn't exist in the browser.
  // Map it to `globalThis` so the WebSocket fallback transport doesn't crash on load.
  define: {
    global: 'globalThis'
  }
});
