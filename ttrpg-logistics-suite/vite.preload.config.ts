import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: '.vite/build',
    lib: {
      entry: resolve(__dirname, 'src/main/preload.ts'),
      formats: ['cjs'],
    },
    rollupOptions: {
      output: {
        entryFileNames: 'preload.js',
      },
    },
    emptyOutDir: false,
  },
});
