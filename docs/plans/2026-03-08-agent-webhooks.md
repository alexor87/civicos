# Agent Webhooks Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Create two Next.js API routes that receive Supabase Database Webhooks and trigger the deployed Edge Functions (`agent-welcome-contact` and `agent-canvass-followup`).

**Architecture:** Supabase sends a POST to our API route on DB events → route verifies shared secret → calls the Edge Function via fetch. The Edge Functions already exist and are deployed; we only need the bridge endpoints.

**Tech Stack:** Next.js 14 App Router API routes, Vitest for tests, `SUPABASE_WEBHOOK_SECRET` env var for auth.

---

## Supabase Webhook Payload Shape

```json
{
  "type": "INSERT" | "UPDATE" | "DELETE",
  "table": "contacts",
  "record": { /* row data */ },
  "old_record": { /* previous row data, only on UPDATE/DELETE */ }
}
```

Headers sent by Supabase: a configurable `Authorization: Bearer <secret>` or custom header. We use `x-webhook-secret` with value `SUPABASE_WEBHOOK_SECRET` env var.

---

## Task 1: Webhook for agent-welcome-contact

**Files:**
- Create: `apps/web/app/api/webhooks/contacts/route.ts`
- Create: `apps/web/__tests__/api/webhooks/contacts.test.ts`

### Step 1: Write failing test

```typescript
// apps/web/__tests__/api/webhooks/contacts.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/webhooks/contacts/route'
import { NextRequest } from 'next/server'

// Mock global fetch
global.fetch = vi.fn()

const WEBHOOK_SECRET = 'test-secret'
const SUPABASE_URL = 'https://test.supabase.co'

beforeEach(() => {
  vi.resetAllMocks()
  process.env.SUPABASE_WEBHOOK_SECRET = WEBHOOK_SECRET
  process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL
})

function makeRequest(body: object, secret?: string): NextRequest {
  return new NextRequest('http://localhost/api/webhooks/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': secret ?? WEBHOOK_SECRET,
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/webhooks/contacts', () => {
  it('returns 401 if secret is missing', async () => {
    const req = makeRequest({ type: 'INSERT', record: {} }, '')
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 if secret is wrong', async () => {
    const req = makeRequest({ type: 'INSERT', record: {} }, 'wrong-secret')
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('ignores non-INSERT events and returns 200', async () => {
    const req = makeRequest({ type: 'UPDATE', record: { id: '1' } })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('calls agent-welcome-contact Edge Function on INSERT', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true })
    const contact = { id: '123', first_name: 'Juan', tenant_id: 't1', campaign_id: 'c1' }
    const req = makeRequest({ type: 'INSERT', record: contact })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(fetch).toHaveBeenCalledWith(
      `${SUPABASE_URL}/functions/v1/agent-welcome-contact`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ record: contact }),
      })
    )
  })

  it('returns 500 if Edge Function call fails', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network error'))
    const contact = { id: '123', first_name: 'Juan', tenant_id: 't1', campaign_id: 'c1' }
    const req = makeRequest({ type: 'INSERT', record: contact })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
```

### Step 2: Run test (expect FAIL — route doesn't exist)

```bash
cd /Users/user/Documents/Dev/Prueba\ 1/civicos/apps/web && . ~/.nvm/nvm.sh && pnpm test __tests__/api/webhooks/contacts.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL with "Cannot find module"

### Step 3: Create the route

```typescript
// apps/web/app/api/webhooks/contacts/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret')
  if (!secret || secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as { type: string; record: Record<string, unknown> }

  if (body.type !== 'INSERT') {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  try {
    await fetch(`${supabaseUrl}/functions/v1/agent-welcome-contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ record: body.record }),
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
```

### Step 4: Run test (expect PASS)

```bash
cd /Users/user/Documents/Dev/Prueba\ 1/civicos/apps/web && . ~/.nvm/nvm.sh && pnpm test __tests__/api/webhooks/contacts.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: 5/5 PASS

### Step 5: Run full test suite (confirm no regressions)

```bash
cd /Users/user/Documents/Dev/Prueba\ 1/civicos/apps/web && . ~/.nvm/nvm.sh && pnpm test 2>&1 | tail -10
```

### Step 6: Commit

```bash
cd /Users/user/Documents/Dev/Prueba\ 1/civicos && git add apps/web/app/api/webhooks/contacts/route.ts apps/web/__tests__/api/webhooks/contacts.test.ts && git commit -m "feat: add webhook endpoint for agent-welcome-contact"
```

---

## Task 2: Webhook for agent-canvass-followup

**Files:**
- Create: `apps/web/app/api/webhooks/visits/route.ts`
- Create: `apps/web/__tests__/api/webhooks/visits.test.ts`

This webhook triggers only when a canvass_visit is UPDATED and the new `result` is `no_home` or `follow_up`.

### Step 1: Write failing test

```typescript
// apps/web/__tests__/api/webhooks/visits.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/webhooks/visits/route'
import { NextRequest } from 'next/server'

global.fetch = vi.fn()

const WEBHOOK_SECRET = 'test-secret'
const SUPABASE_URL = 'https://test.supabase.co'

beforeEach(() => {
  vi.resetAllMocks()
  process.env.SUPABASE_WEBHOOK_SECRET = WEBHOOK_SECRET
  process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL
})

function makeRequest(body: object, secret?: string): NextRequest {
  return new NextRequest('http://localhost/api/webhooks/visits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': secret ?? WEBHOOK_SECRET,
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/webhooks/visits', () => {
  it('returns 401 if secret is missing', async () => {
    const req = makeRequest({ type: 'UPDATE', record: {} }, '')
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 if secret is wrong', async () => {
    const req = makeRequest({ type: 'UPDATE', record: {} }, 'bad-secret')
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('ignores INSERT events and returns 200', async () => {
    const req = makeRequest({ type: 'INSERT', record: { id: '1', result: 'no_home' } })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('ignores UPDATE with non-triggering result', async () => {
    const req = makeRequest({ type: 'UPDATE', record: { id: '1', result: 'positive' } })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('calls agent-canvass-followup on UPDATE with result=no_home', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true })
    const visit = { id: '1', result: 'no_home', tenant_id: 't1', campaign_id: 'c1' }
    const req = makeRequest({ type: 'UPDATE', record: visit })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(fetch).toHaveBeenCalledWith(
      `${SUPABASE_URL}/functions/v1/agent-canvass-followup`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ record: visit }),
      })
    )
  })

  it('calls agent-canvass-followup on UPDATE with result=follow_up', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true })
    const visit = { id: '2', result: 'follow_up', tenant_id: 't1', campaign_id: 'c1' }
    const req = makeRequest({ type: 'UPDATE', record: visit })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(fetch).toHaveBeenCalledWith(
      `${SUPABASE_URL}/functions/v1/agent-canvass-followup`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ record: visit }),
      })
    )
  })

  it('returns 500 if Edge Function call fails', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network error'))
    const visit = { id: '3', result: 'no_home', tenant_id: 't1', campaign_id: 'c1' }
    const req = makeRequest({ type: 'UPDATE', record: visit })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
```

### Step 2: Run test (expect FAIL)

```bash
cd /Users/user/Documents/Dev/Prueba\ 1/civicos/apps/web && . ~/.nvm/nvm.sh && pnpm test __tests__/api/webhooks/visits.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL with "Cannot find module"

### Step 3: Create the route

```typescript
// apps/web/app/api/webhooks/visits/route.ts
import { NextRequest, NextResponse } from 'next/server'

const TRIGGER_RESULTS = ['no_home', 'follow_up']

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret')
  if (!secret || secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as { type: string; record: Record<string, unknown> }

  if (body.type !== 'UPDATE' || !TRIGGER_RESULTS.includes(body.record.result as string)) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  try {
    await fetch(`${supabaseUrl}/functions/v1/agent-canvass-followup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ record: body.record }),
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
```

### Step 4: Run test (expect PASS)

```bash
cd /Users/user/Documents/Dev/Prueba\ 1/civicos/apps/web && . ~/.nvm/nvm.sh && pnpm test __tests__/api/webhooks/visits.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: 7/7 PASS

### Step 5: Run full test suite

```bash
cd /Users/user/Documents/Dev/Prueba\ 1/civicos/apps/web && . ~/.nvm/nvm.sh && pnpm test 2>&1 | tail -10
```

### Step 6: Commit

```bash
cd /Users/user/Documents/Dev/Prueba\ 1/civicos && git add apps/web/app/api/webhooks/visits/route.ts apps/web/__tests__/api/webhooks/visits.test.ts && git commit -m "feat: add webhook endpoint for agent-canvass-followup"
```
