import { defineConfig } from 'vite';
export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? '/superAsh/' : '/',
  server: { host: '127.0.0.1' },
  build: { rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } } },
}));
