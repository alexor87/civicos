import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Avoid touching Supabase in middleware tests — return a no-op client.
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
  }),
}))

import { middleware } from '@/middleware'

function req(url: string, host: string) {
  return new NextRequest(new URL(url), {
    headers: { host },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('middleware apex → app redirect', () => {
  it('redirects scrutix.co/login to app.scrutix.co/login (301)', async () => {
    const res = await middleware(req('https://scrutix.co/login', 'scrutix.co'))
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe('https://app.scrutix.co/login')
  })

  it('preserves query string on redirect', async () => {
    const res = await middleware(
      req('https://scrutix.co/register?ref=abc', 'scrutix.co')
    )
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe(
      'https://app.scrutix.co/register?ref=abc'
    )
  })

  it('redirects www.scrutix.co apex host too', async () => {
    const res = await middleware(
      req('https://www.scrutix.co/dashboard', 'www.scrutix.co')
    )
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe('https://app.scrutix.co/dashboard')
  })

  it('does NOT redirect /en (landing page) on apex', async () => {
    const res = await middleware(req('https://scrutix.co/en', 'scrutix.co'))
    // Locale marketing route → pass through, not a 301 to app.
    expect(res.status).not.toBe(301)
    expect(res.headers.get('location')).not.toBe('https://app.scrutix.co/en')
  })

  it('does NOT redirect on app.scrutix.co host', async () => {
    const res = await middleware(
      req('https://app.scrutix.co/login', 'app.scrutix.co')
    )
    expect(res.headers.get('location') || '').not.toContain('app.scrutix.co/login')
  })

  it('does NOT redirect on localhost', async () => {
    const res = await middleware(
      req('http://localhost:3000/login', 'localhost:3000')
    )
    // No apex redirect → falls through to Supabase auth flow (no location to app.scrutix.co)
    const location = res.headers.get('location') || ''
    expect(location).not.toContain('app.scrutix.co')
  })
})
