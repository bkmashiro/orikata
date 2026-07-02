import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Fold3D',
      fileName: 'fold3d',
      formats: ['es', 'umd']
    },
    sourcemap: true
  },
  test: {
    environment: 'jsdom'
  }
});
