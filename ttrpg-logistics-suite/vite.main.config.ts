import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: '.vite/build',
    lib: {
      entry: resolve(__dirname, 'src/main/index.ts'),
      formats: ['cjs'],
    },
    rollupOptions: {
      external: ['electron', 'sqlite3', 'express', 'path', 'fs', 'fs/promises'],
      output: {
        entryFileNames: 'main.js',
      },
    },
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
});
