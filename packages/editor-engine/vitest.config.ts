import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'editor-engine',
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
