import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/runtime/**/*.ts'],
      exclude: [
        'src/runtime/types/**',
        'src/runtime/plugin.ts',
      ],
    },
    setupFiles: ['./test/utils/setup.ts'],
  },
  resolve: {
    alias: {
      '#imports': resolve(__dirname, './test/mocks/imports.ts'),
      '#app': resolve(__dirname, './test/mocks/app.ts'),
    },
  },
});
