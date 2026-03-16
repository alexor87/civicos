# Realtime Dashboard KPIs Implementation Plan

**Goal:** Dashboard KPIs actualicen en tiempo real cuando cambian `contacts` o `canvass_visits` en Supabase.

**Architecture:**
- `RealtimeKPIs` (Client Component) recibe KPI iniciales del Server Component como props, suscribe a Supabase Realtime en `contacts` y `canvass_visits`, y al recibir cualquier evento llama a `/api/dashboard/kpis` para refrescar los counts reales desde la DB.
- `/api/dashboard/kpis` (API route) retorna los 4 counts para un campaignId autenticado.
- `DashboardPage` (Server Component) pasa KPI iniciales + campaignId a `RealtimeKPIs`.

**Tech Stack:** Supabase Realtime (browser client), Next.js API route, React useState + useEffect.

---

## Task 1: API route /api/dashboard/kpis

**Files:**
- Create: `apps/web/app/api/dashboard/kpis/route.ts`
- Create: `apps/web/__tests__/api/dashboard/kpis.test.ts`

### Step 1: Write failing tests

```typescript
// apps/web/__tests__/api/dashboard/kpis.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/dashboard/kpis/route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'

const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
}

beforeEach(() => {
  vi.resetAllMocks()
  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase)
})

function makeRequest(campaignId?: string): NextRequest {
  const url = campaignId
    ? `http://localhost/api/dashboard/kpis?campaignId=${campaignId}`
    : 'http://localhost/api/dashboard/kpis'
  return new NextRequest(url)
}

describe('GET /api/dashboard/kpis', () => {
  it('returns 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const res = await GET(makeRequest('c1'))
    expect(res.status).toBe(401)
  })

  it('returns 400 if campaignId is missing', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    const res = await GET(makeRequest())
    expect(res.status).toBe(400)
  })

  it('returns KPI counts for authenticated user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    // Mock chained Supabase query: .from().select().eq().eq() → { count }
    const mockChain = (count: number) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      then: undefined,
      // Make it thenable/awaitable
      ...{ count },
    })

    // We need to mock Promise.all-style queries
    // Each from() call returns different chain
    let callCount = 0
    const counts = [10, 4, 2, 8] // totalContacts, supporters, pendingVisits, totalVisits

    mockSupabase.from.mockImplementation(() => {
      const count = counts[callCount++] ?? 0
      const chain: Record<string, unknown> = {}
      chain.select = vi.fn().mockReturnValue(chain)
      chain.eq = vi.fn().mockReturnValue(chain)
      chain.is = vi.fn().mockReturnValue(chain)
      // Make awaitable
      chain.then = (resolve: (v: { count: number }) => void) => resolve({ count })
      return chain
    })

    const res = await GET(makeRequest('c1'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toMatchObject({
      totalContacts: expect.any(Number),
      supporters: expect.any(Number),
      pendingVisits: expect.any(Number),
      totalVisits: expect.any(Number),
      supportRate: expect.any(Number),
      coverageRate: expect.any(Number),
    })
  })
})
```

### Step 2: Run test to see it fail

```bash
cd /Users/user/Documents/Dev/Prueba\ 1/civicos/apps/web && . ~/.nvm/nvm.sh && pnpm test __tests__/api/dashboard/kpis.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL with "Cannot find module"

### Step 3: Create the route

```typescript
// apps/web/app/api/dashboard/kpis/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const campaignId = request.nextUrl.searchParams.get('campaignId')
  if (!campaignId) return NextResponse.json({ error: 'campaignId required' }, { status: 400 })

  const [
    { count: totalContacts },
    { count: supporters },
    { count: pendingVisits },
    { count: totalVisits },
  ] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('campaign_id', campaignId),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('campaign_id', campaignId).eq('status', 'supporter'),
    supabase.from('canvass_visits').select('*', { count: 'exact', head: true }).eq('campaign_id', campaignId).is('approved_at', null),
    supabase.from('canvass_visits').select('*', { count: 'exact', head: true }).eq('campaign_id', campaignId),
  ])

  const tc = totalContacts ?? 0
  const s = supporters ?? 0
  const tv = totalVisits ?? 0
  const pv = pendingVisits ?? 0

  return NextResponse.json({
    totalContacts: tc,
    supporters: s,
    pendingVisits: pv,
    totalVisits: tv,
    supportRate: tc ? Math.round((s / tc) * 100) : 0,
    coverageRate: tc ? Math.round((tv / tc) * 100) : 0,
  })
}
```

### Step 4: Run test to confirm pass

```bash
cd /Users/user/Documents/Dev/Prueba\ 1/civicos/apps/web && . ~/.nvm/nvm.sh && pnpm test __tests__/api/dashboard/kpis.test.ts --reporter=verbose 2>&1 | tail -20
```

### Step 5: Run full suite (no regressions)

```bash
cd /Users/user/Documents/Dev/Prueba\ 1/civicos/apps/web && . ~/.nvm/nvm.sh && pnpm test 2>&1 | tail -10
```

### Step 6: Commit

```bash
cd /Users/user/Documents/Dev/Prueba\ 1/civicos/apps/web && git add app/api/dashboard/kpis/route.ts __tests__/api/dashboard/kpis.test.ts && git commit -m "feat: add /api/dashboard/kpis endpoint for realtime refresh"
```

---

## Task 2: RealtimeKPIs Client Component

**Files:**
- Create: `apps/web/components/dashboard/RealtimeKPIs.tsx`
- Create: `apps/web/__tests__/components/RealtimeKPIs.test.tsx`

### Step 1: Write failing tests

```typescript
// apps/web/__tests__/components/RealtimeKPIs.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { RealtimeKPIs } from '@/components/dashboard/RealtimeKPIs'

// Mock DashboardKPIs
vi.mock('@/components/dashboard/DashboardKPIs', () => ({
  DashboardKPIs: (props: Record<string, unknown>) => (
    <div data-testid="kpis"
      data-total={props.totalContacts}
      data-supporters={props.supporters}
      data-pending={props.pendingVisits}
      data-visits={props.totalVisits}
    />
  ),
}))

// Mock fetch
global.fetch = vi.fn()

// Mock Supabase client
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
}
const mockUnsubscribe = vi.fn()
const mockSupabase = {
  channel: vi.fn().mockReturnValue(mockChannel),
  removeChannel: vi.fn(),
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

const initialProps = {
  campaignId: 'campaign-1',
  initialKPIs: {
    totalContacts: 100,
    supporters: 40,
    pendingVisits: 5,
    totalVisits: 80,
    supportRate: 40,
    coverageRate: 80,
    weeklyData: [],
  },
}

beforeEach(() => {
  vi.resetAllMocks()
  mockSupabase.channel.mockReturnValue(mockChannel)
  mockChannel.on.mockReturnThis()
  mockChannel.subscribe.mockReturnThis()
  ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ totalContacts: 101, supporters: 41, pendingVisits: 4, totalVisits: 81, supportRate: 41, coverageRate: 80 }),
  })
})

describe('RealtimeKPIs', () => {
  it('renders initial KPIs immediately', () => {
    render(<RealtimeKPIs {...initialProps} />)
    const el = screen.getByTestId('kpis')
    expect(el.dataset.total).toBe('100')
    expect(el.dataset.supporters).toBe('40')
  })

  it('subscribes to contacts and canvass_visits channels', () => {
    render(<RealtimeKPIs {...initialProps} />)
    // Should create a channel subscription
    expect(mockSupabase.channel).toHaveBeenCalled()
    expect(mockChannel.on).toHaveBeenCalled()
    expect(mockChannel.subscribe).toHaveBeenCalled()
  })

  it('fetches fresh KPIs and updates state on realtime event', async () => {
    render(<RealtimeKPIs {...initialProps} />)

    // Simulate a Realtime event by calling the callback registered with .on()
    const onCall = mockChannel.on.mock.calls[0]
    const callback = onCall?.[2] // third arg is the callback

    await act(async () => {
      callback?.()
    })

    await waitFor(() => {
      const el = screen.getByTestId('kpis')
      expect(el.dataset.total).toBe('101')
    })
  })

  it('removes channel subscription on unmount', () => {
    const { unmount } = render(<RealtimeKPIs {...initialProps} />)
    unmount()
    expect(mockSupabase.removeChannel).toHaveBeenCalled()
  })
})
```

### Step 2: Run test to see it fail

```bash
cd /Users/user/Documents/Dev/Prueba\ 1/civicos/apps/web && . ~/.nvm/nvm.sh && pnpm test __tests__/components/RealtimeKPIs.test.tsx --reporter=verbose 2>&1 | tail -20
```

### Step 3: Create the component

```typescript
// apps/web/components/dashboard/RealtimeKPIs.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardKPIs } from '@/components/dashboard/DashboardKPIs'

interface WeeklyDataPoint { week: string; contacts: number }

interface KPIData {
  totalContacts: number
  supporters: number
  pendingVisits: number
  totalVisits: number
  supportRate: number
  coverageRate: number
  weeklyData: WeeklyDataPoint[]
}

interface Props {
  campaignId: string
  initialKPIs: KPIData
}

export function RealtimeKPIs({ campaignId, initialKPIs }: Props) {
  const [kpis, setKpis] = useState<KPIData>(initialKPIs)

  useEffect(() => {
    const supabase = createClient()

    async function refreshKPIs() {
      const res = await fetch(`/api/dashboard/kpis?campaignId=${campaignId}`)
      if (!res.ok) return
      const data = await res.json()
      setKpis(prev => ({ ...prev, ...data }))
    }

    const channel = supabase
      .channel(`dashboard-kpis-${campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts', filter: `campaign_id=eq.${campaignId}` }, refreshKPIs)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'canvass_visits', filter: `campaign_id=eq.${campaignId}` }, refreshKPIs)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [campaignId])

  return (
    <DashboardKPIs
      totalContacts={kpis.totalContacts}
      supporters={kpis.supporters}
      supportRate={kpis.supportRate}
      totalVisits={kpis.totalVisits}
      coverageRate={kpis.coverageRate}
      pendingVisits={kpis.pendingVisits}
      weeklyData={kpis.weeklyData}
    />
  )
}
```

### Step 4: Run test to confirm pass

```bash
cd /Users/user/Documents/Dev/Prueba\ 1/civicos/apps/web && . ~/.nvm/nvm.sh && pnpm test __tests__/components/RealtimeKPIs.test.tsx --reporter=verbose 2>&1 | tail -20
```

### Step 5: Full suite

```bash
cd /Users/user/Documents/Dev/Prueba\ 1/civicos/apps/web && . ~/.nvm/nvm.sh && pnpm test 2>&1 | tail -10
```

### Step 6: Commit

```bash
cd /Users/user/Documents/Dev/Prueba\ 1/civicos/apps/web && git add components/dashboard/RealtimeKPIs.tsx __tests__/components/RealtimeKPIs.test.tsx && git commit -m "feat: add RealtimeKPIs component with Supabase Realtime subscription"
```

---

## Task 3: Wire RealtimeKPIs into DashboardPage

**Files:**
- Modify: `apps/web/app/dashboard/page.tsx`
- Modify: `apps/web/__tests__/components/DashboardPage.test.tsx` (or create if not exists)

### Step 1: Check if there's an existing DashboardPage test

Look for `apps/web/__tests__/` for any file referencing dashboard/page.

### Step 2: Update DashboardPage

In `apps/web/app/dashboard/page.tsx`:
- Replace `import { DashboardKPIs }` with `import { RealtimeKPIs }`
- Replace `<DashboardKPIs ... />` with `<RealtimeKPIs campaignId={campaignId ?? ''} initialKPIs={{ totalContacts: ..., supporters: ..., supportRate, totalVisits, coverageRate, pendingVisits, weeklyData }} />`

### Step 3: Run full test suite

```bash
cd /Users/user/Documents/Dev/Prueba\ 1/civicos/apps/web && . ~/.nvm/nvm.sh && pnpm test 2>&1 | tail -10
```

### Step 4: Commit

```bash
cd /Users/user/Documents/Dev/Prueba\ 1/civicos/apps/web && git add app/dashboard/page.tsx && git commit -m "feat: wire RealtimeKPIs into dashboard page"
```
