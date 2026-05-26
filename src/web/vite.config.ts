import react from '@vitejs/plugin-react'
// Import from 'vitest/config' (not 'vite') so the inline `test` block below
// is typed against Vitest's merged config type. Importing from 'vite' would
// have UserConfig with no `test` property and silently accept it only
// because the root tsconfig stops `tsc --noEmit` from descending into the
// node project — see typecheck script for the matching tsc -b switch.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/move': 'http://localhost:8000',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./app/test-setup.ts'],
    include: ['app/**/*_test.{ts,tsx}'],
  },
})
