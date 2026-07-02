import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Orikata',
      fileName: 'orikata',
      formats: ['es', 'umd']
    },
    sourcemap: true
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts']
  }
});
