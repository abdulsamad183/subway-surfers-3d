import { defineConfig } from 'vite';

export default defineConfig({
  // Required for https://abdulsamad183.github.io/subway-surfers-3d/
  base: '/subway-surfers-3d/',
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'esnext',
  },
});
