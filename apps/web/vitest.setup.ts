import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock isomorphic-dompurify globally to avoid jsdom/dom-selector ESM compatibility issues.
// In tests we don't need real HTML sanitization — just pass content through.
vi.mock('isomorphic-dompurify', () => ({
  default: {
    sanitize: (html: string) => html,
  },
}))
