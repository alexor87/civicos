import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
    coverage: {
      reporter: ['text', 'lcov'],
      exclude: ['node_modules', '.next', 'vitest.config.ts', 'vitest.setup.ts'],
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(__dirname, '.'),
      'react': path.resolve(__dirname, '../../node_modules/.pnpm/react@19.2.3/node_modules/react'),
      'react-dom': path.resolve(__dirname, '../../node_modules/.pnpm/react-dom@19.2.3_react@19.2.3/node_modules/react-dom'),
    },
  },
})
