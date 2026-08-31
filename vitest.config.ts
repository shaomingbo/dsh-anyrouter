import { defineConfig } from 'vitest/config'

// `test/` holds node:test runner suites (the installer contract); vitest owns
// `tests/` and must not try to collect them.
export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', 'test/**'],
  },
})
