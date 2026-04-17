import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    outDir:      'assets/react-dist',
    emptyOutDir: false,
    lib: {
      entry:    resolve(__dirname, 'src/adaptive/main.jsx'),
      name:     'CodiviumAdaptive',
      fileName: () => 'adaptive.bundle.js',
      formats:  ['iife'],
    },
    rollupOptions: {
      external: [],
    },
  },
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
});
