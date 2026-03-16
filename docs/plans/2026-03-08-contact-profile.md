# Contact Profile Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Build the individual contact profile page (`/dashboard/contacts/[id]`) showing contact info and a timeline of canvassing visits.

**Architecture:** Two-piece design: (1) a testable `ContactProfile` Client Component that receives contact + visits as props, (2) a Server Component page at `app/dashboard/contacts/[id]/page.tsx` that fetches the data from Supabase and passes it to `ContactProfile`. This mirrors the existing `ContactsTable` / `contacts/page.tsx` pattern.

**Tech Stack:** Next.js App Router (Server Component page + Client Component), shadcn/ui (Badge, Card), Lucide React icons, Vitest + React Testing Library, Supabase server client

---

## Key Context

- Project root: `/Users/user/Documents/Dev/Prueba 1/civicos/`
- App dir: `apps/web/app/`
- Test dir: `apps/web/__tests__/components/`
- Test command: `cd "/Users/user/Documents/Dev/Prueba 1/civicos/apps/web" && pnpm vitest run`
- Database types: `apps/web/lib/types/database.ts`
- Supabase server client: `apps/web/lib/supabase/server.ts` — use `await createClient()`
- Contacts list already navigates to `/dashboard/contacts/${contact.id}` on row click
- The page inherits the dashboard layout (Sidebar + auth) automatically

## Database schema relevant to this feature

```ts
// contacts table
{
  id: string, tenant_id: string, campaign_id: string,
  first_name: string, last_name: string,
  email: string | null, phone: string | null,
  address: string | null, city: string | null, district: string | null,
  status: 'undecided' | 'supporter' | 'opponent' | 'unknown',
  tags: string[], notes: string | null,
  created_at: string, updated_at: string
}

// canvass_visits table
{
  id: string, tenant_id: string, campaign_id: string,
  contact_id: string, volunteer_id: string,
  result: 'positive' | 'negative' | 'undecided' | 'no_home' | 'follow_up' | 'refused',
  notes: string | null,
  approved_at: string | null,
  created_at: string
}
```

---

### Task 1: ContactProfile component

**Files:**
- Create: `apps/web/components/dashboard/ContactProfile.tsx`
- Create: `apps/web/__tests__/components/ContactProfile.test.tsx`

---

**Step 1: Write the failing test**

Create `apps/web/__tests__/components/ContactProfile.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContactProfile } from '@/components/dashboard/ContactProfile'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

function makeContact(overrides = {}) {
  return {
    id: 'c-1',
    tenant_id: 't-1',
    campaign_id: 'camp-1',
    first_name: 'María',
    last_name: 'López',
    email: 'maria@test.com',
    phone: '555-9999',
    city: 'Medellín',
    district: 'El Poblado',
    address: 'Calle 10 # 43',
    status: 'supporter' as const,
    tags: ['vip', 'zona-sur'],
    notes: 'Contacto importante del barrio',
    metadata: {},
    geo: null,
    embedding: null,
    search_vec: null,
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-01T10:00:00Z',
    ...overrides,
  }
}

function makeVisit(overrides = {}) {
  return {
    id: 'v-1',
    tenant_id: 't-1',
    campaign_id: 'camp-1',
    contact_id: 'c-1',
    volunteer_id: 'u-1',
    zone_id: null,
    result: 'positive' as const,
    notes: 'Muy receptivo',
    metadata: {},
    synced_at: null,
    approved_at: '2024-02-01T12:00:00Z',
    approved_by: null,
    created_at: '2024-02-01T11:00:00Z',
    volunteerName: 'Carlos Ruiz',
    ...overrides,
  }
}

describe('ContactProfile', () => {
  it('renders the contact full name', () => {
    render(<ContactProfile contact={makeContact()} visits={[]} />)
    expect(screen.getByText('María López')).toBeInTheDocument()
  })

  it('renders the status badge for supporter', () => {
    render(<ContactProfile contact={makeContact()} visits={[]} />)
    expect(screen.getByText('Simpatizante')).toBeInTheDocument()
  })

  it('renders email and phone', () => {
    render(<ContactProfile contact={makeContact()} visits={[]} />)
    expect(screen.getByText('maria@test.com')).toBeInTheDocument()
    expect(screen.getByText('555-9999')).toBeInTheDocument()
  })

  it('renders city and district', () => {
    render(<ContactProfile contact={makeContact()} visits={[]} />)
    expect(screen.getByText(/Medellín/)).toBeInTheDocument()
    expect(screen.getByText(/El Poblado/)).toBeInTheDocument()
  })

  it('renders tags', () => {
    render(<ContactProfile contact={makeContact()} visits={[]} />)
    expect(screen.getByText('vip')).toBeInTheDocument()
    expect(screen.getByText('zona-sur')).toBeInTheDocument()
  })

  it('renders notes', () => {
    render(<ContactProfile contact={makeContact()} visits={[]} />)
    expect(screen.getByText('Contacto importante del barrio')).toBeInTheDocument()
  })

  it('shows empty state when no visits', () => {
    render(<ContactProfile contact={makeContact()} visits={[]} />)
    expect(screen.getByText(/sin visitas/i)).toBeInTheDocument()
  })

  it('renders a visit with result badge and volunteer name', () => {
    render(<ContactProfile contact={makeContact()} visits={[makeVisit()]} />)
    expect(screen.getByText('Positivo')).toBeInTheDocument()
    expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument()
  })

  it('renders visit notes', () => {
    render(<ContactProfile contact={makeContact()} visits={[makeVisit()]} />)
    expect(screen.getByText('Muy receptivo')).toBeInTheDocument()
  })

  it('renders "—" when email is null', () => {
    render(<ContactProfile contact={makeContact({ email: null })} visits={[]} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd "/Users/user/Documents/Dev/Prueba 1/civicos/apps/web" && pnpm vitest run __tests__/components/ContactProfile.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/dashboard/ContactProfile'`

**Step 3: Create the ContactProfile component**

Create `apps/web/components/dashboard/ContactProfile.tsx`:

```tsx
'use client'

import { Badge } from '@/components/ui/badge'
import { Mail, Phone, MapPin, Tag, FileText, Calendar } from 'lucide-react'
import type { Database } from '@/lib/types/database'

type Contact = Database['public']['Tables']['contacts']['Row']
type VisitResult = Database['public']['Tables']['canvass_visits']['Row']['result']

export interface VisitWithVolunteer {
  id: string
  contact_id: string
  result: VisitResult
  notes: string | null
  approved_at: string | null
  created_at: string
  volunteerName: string
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  supporter: { label: 'Simpatizante', variant: 'default' },
  undecided:  { label: 'Indeciso',    variant: 'secondary' },
  opponent:   { label: 'Opositor',    variant: 'destructive' },
  unknown:    { label: 'Desconocido', variant: 'outline' },
}

const resultConfig: Record<VisitResult, { label: string; className: string }> = {
  positive:  { label: 'Positivo',    className: 'bg-green-100 text-green-700' },
  negative:  { label: 'Negativo',    className: 'bg-red-100 text-red-700' },
  undecided: { label: 'Indeciso',    className: 'bg-yellow-100 text-yellow-700' },
  no_home:   { label: 'No en casa',  className: 'bg-slate-100 text-slate-600' },
  follow_up: { label: 'Seguimiento', className: 'bg-blue-100 text-blue-700' },
  refused:   { label: 'Rechazó',     className: 'bg-orange-100 text-orange-700' },
}

interface Props {
  contact: Contact
  visits: VisitWithVolunteer[]
}

export function ContactProfile({ contact, visits }: Props) {
  const status = statusConfig[contact.status] ?? statusConfig.unknown

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {contact.first_name} {contact.last_name}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Registrado el {new Date(contact.created_at).toLocaleDateString('es-ES')}
          </p>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact info card */}
        <div className="lg:col-span-1 border rounded-lg bg-white p-5 space-y-4">
          <h2 className="font-semibold text-slate-800">Información</h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="h-4 w-4 shrink-0 text-slate-400" />
              <span>{contact.email ?? '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="h-4 w-4 shrink-0 text-slate-400" />
              <span>{contact.phone ?? '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
              <span>
                {[contact.city, contact.district].filter(Boolean).join(', ') || '—'}
              </span>
            </div>
            {contact.address && (
              <div className="flex items-start gap-2 text-slate-600">
                <MapPin className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                <span>{contact.address}</span>
              </div>
            )}
          </div>

          {contact.tags.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Tag className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tags</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {contact.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {contact.notes && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Notas</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{contact.notes}</p>
            </div>
          )}
        </div>

        {/* Canvassing timeline */}
        <div className="lg:col-span-2 border rounded-lg bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Historial de canvassing</h2>
            <span className="text-xs text-slate-400">{visits.length} visita{visits.length !== 1 ? 's' : ''}</span>
          </div>

          {visits.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              Sin visitas registradas
            </div>
          ) : (
            <ol className="space-y-4">
              {visits.map(visit => {
                const result = resultConfig[visit.result]
                return (
                  <li key={visit.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                      <div className="w-px flex-1 bg-slate-100 mt-1" />
                    </div>
                    <div className="pb-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${result.className}`}>
                          {result.label}
                        </span>
                        <span className="text-xs text-slate-500">{visit.volunteerName}</span>
                        <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(visit.created_at).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                      {visit.notes && (
                        <p className="text-sm text-slate-600 mt-1">{visit.notes}</p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
cd "/Users/user/Documents/Dev/Prueba 1/civicos/apps/web" && pnpm vitest run __tests__/components/ContactProfile.test.tsx
```

Expected: PASS — 10/10 tests pass

**Step 5: Commit**

```bash
cd "/Users/user/Documents/Dev/Prueba 1/civicos/apps/web" && git add components/dashboard/ContactProfile.tsx __tests__/components/ContactProfile.test.tsx && git commit -m "feat: add ContactProfile component with canvassing timeline"
```

---

### Task 2: Contact profile page (Server Component)

**Files:**
- Create: `apps/web/app/dashboard/contacts/[id]/page.tsx`

Note: This is a Server Component — no unit test needed (the component logic is just data fetching + wiring). Integration is verified by running all tests and confirming no regressions.

---

**Step 1: Create the page**

Create `apps/web/app/dashboard/contacts/[id]/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { ContactProfile } from '@/components/dashboard/ContactProfile'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function ContactProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0]

  // Fetch contact (RLS enforces tenant isolation)
  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .eq('campaign_id', campaignId ?? '')
    .single()

  if (!contact) notFound()

  // Fetch canvass visits with volunteer name
  const { data: rawVisits } = await supabase
    .from('canvass_visits')
    .select('*, profiles!volunteer_id(full_name)')
    .eq('contact_id', id)
    .order('created_at', { ascending: false })

  const visits = (rawVisits ?? []).map(v => ({
    ...v,
    volunteerName: (v.profiles as { full_name: string } | null)?.full_name ?? 'Voluntario',
  }))

  return (
    <div>
      <div className="px-6 pt-6">
        <Link href="/dashboard/contacts">
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 -ml-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Contactos
          </Button>
        </Link>
      </div>
      <ContactProfile contact={contact} visits={visits} />
    </div>
  )
}
```

**Step 2: Run all tests to verify no regressions**

```bash
cd "/Users/user/Documents/Dev/Prueba 1/civicos/apps/web" && pnpm vitest run
```

Expected: All previous tests pass + 10 new ContactProfile tests = full suite green

**Step 3: Commit**

```bash
cd "/Users/user/Documents/Dev/Prueba 1/civicos/apps/web" && git add app/dashboard/contacts/\[id\]/page.tsx && git commit -m "feat: add contact profile page with canvassing history"
```

---

## Definition of Done

- [ ] `ContactProfile` component renders: name, status badge, email, phone, city+district, tags, notes
- [ ] `ContactProfile` shows "Sin visitas registradas" when no visits
- [ ] `ContactProfile` renders each visit: result badge (color-coded), volunteer name, date, notes
- [ ] `/dashboard/contacts/[id]` page fetches contact + visits from Supabase and renders `ContactProfile`
- [ ] Page returns 404 (`notFound()`) when contact doesn't exist or belongs to another tenant
- [ ] Back button navigates to `/dashboard/contacts`
- [ ] 10 tests passing, zero regressions in full suite
