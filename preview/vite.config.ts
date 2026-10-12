import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  publicDir: fileURLToPath(new URL('../public', import.meta.url)),
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  build: {
    outDir: '../dist/preview', emptyOutDir: true,
    rollupOptions: { output: { manualChunks(id) {
      if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react';
      if (/[\\/]node_modules[\\/]@dnd-kit[\\/]/.test(id)) return 'drag-drop';
    } } },
  },
});
