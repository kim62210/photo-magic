import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'editor-engine',
    environment: 'jsdom',
    globals: false,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
