import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContactsTable } from '@/components/dashboard/ContactsTable'

// ── Next.js navigation mocks ───────────────────────────────────────────────────
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/dashboard/contacts',
  useSearchParams: () => new URLSearchParams(),
}))

// ── Fixtures ───────────────────────────────────────────────────────────────────
function makeContact(overrides = {}) {
  return {
    id: 'c-1',
    tenant_id: 't-1',
    campaign_id: 'camp-1',
    first_name: 'Juan',
    last_name: 'Pérez',
    email: 'juan@test.com',
    phone: '555-1234',
    city: 'Bogotá',
    district: null,
    address: null,
    status: 'supporter',
    tags: ['vip', 'zona-norte'],
    notes: null,
    metadata: {},
    geo: null,
    embedding: null,
    search_vec: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    ...overrides,
  }
}

const DEFAULT_PROPS = {
  contacts: [makeContact()],
  estimatedTotal: 1,
  pageSize: 50,
  hasMore: false,
  hasPrev: false,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ContactsTable', () => {
  it('renders contact name correctly', () => {
    render(<ContactsTable {...DEFAULT_PROPS} />)
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
  })

  it('renders email', () => {
    render(<ContactsTable {...DEFAULT_PROPS} />)
    expect(screen.getByText('juan@test.com')).toBeInTheDocument()
  })

  it('shows "—" when email is null', () => {
    render(<ContactsTable {...DEFAULT_PROPS} contacts={[makeContact({ email: null })]} />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('renders ALTO sympathy badge for supporter status', () => {
    render(<ContactsTable {...DEFAULT_PROPS} />)
    expect(screen.getByText('ALTO')).toBeInTheDocument()
  })

  it('renders BAJO sympathy badge for opponent status', () => {
    render(<ContactsTable {...DEFAULT_PROPS} contacts={[makeContact({ status: 'opponent' })]} />)
    expect(screen.getByText('BAJO')).toBeInTheDocument()
  })

  it('shows empty state message when no contacts and no search query', () => {
    render(<ContactsTable {...DEFAULT_PROPS} contacts={[]} total={0} />)
    expect(screen.getByText(/importa un csv/i)).toBeInTheDocument()
  })

  it('shows "no se encontraron" when search has no results', () => {
    render(<ContactsTable {...DEFAULT_PROPS} contacts={[]} total={0} searchQuery="xyz" />)
    expect(screen.getByText(/no se encontraron/i)).toBeInTheDocument()
  })

  it('renders MEDIO sympathy badge for undecided status', () => {
    const contact = makeContact({ status: 'undecided' })
    render(<ContactsTable {...DEFAULT_PROPS} contacts={[contact]} />)
    expect(screen.getByText('MEDIO')).toBeInTheDocument()
  })

  it('does not show pagination when no more pages', () => {
    render(<ContactsTable {...DEFAULT_PROPS} hasMore={false} hasPrev={false} />)
    expect(screen.queryByText(/siguiente/i)).not.toBeInTheDocument()
  })

  it('shows next button when hasMore is true', () => {
    render(<ContactsTable {...DEFAULT_PROPS} hasMore={true} hasPrev={false} nextCursor="2024-01-15T10:00:00Z" />)
    expect(screen.getAllByText(/siguiente/i).length).toBeGreaterThanOrEqual(1)
  })
})
