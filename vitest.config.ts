import { defineConfig } from 'vitest/config';
export default defineConfig({
  define: { __BUILD_DAY__: JSON.stringify('2026-10-20') },
  test: { include: ['src/**/*.test.ts', 'tests/**/*.test.ts'] },
});
