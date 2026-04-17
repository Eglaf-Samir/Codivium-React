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
      entry:    resolve(__dirname, 'src/insights/main.jsx'),
      name:     'CodiviumInsightsDashboard',
      fileName: () => 'insights-dashboard.bundle.js',
      formats:  ['iife'],
    },
    rollupOptions: {
      // Bundle everything including Chart.js — the vendor file doesn't exist locally
      // so we cannot rely on polyfill-loader to supply it.
      external: [],
    },
  },
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
});
