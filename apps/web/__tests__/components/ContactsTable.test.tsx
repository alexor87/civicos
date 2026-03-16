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
  total: 1,
  page: 1,
  pageSize: 50,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ContactsTable', () => {
  it('renders contact name correctly', () => {
    render(<ContactsTable {...DEFAULT_PROPS} />)
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
  })

  it('renders email and phone', () => {
    render(<ContactsTable {...DEFAULT_PROPS} />)
    expect(screen.getByText('juan@test.com')).toBeInTheDocument()
    expect(screen.getByText('555-1234')).toBeInTheDocument()
  })

  it('shows "—" when email is null', () => {
    render(<ContactsTable {...DEFAULT_PROPS} contacts={[makeContact({ email: null })]} />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('renders Simpatizante badge for supporter status', () => {
    render(<ContactsTable {...DEFAULT_PROPS} />)
    expect(screen.getByText('Simpatizante')).toBeInTheDocument()
  })

  it('renders Opositor badge for opponent status', () => {
    render(<ContactsTable {...DEFAULT_PROPS} contacts={[makeContact({ status: 'opponent' })]} />)
    expect(screen.getByText('Opositor')).toBeInTheDocument()
  })

  it('shows empty state message when no contacts and no search query', () => {
    render(<ContactsTable {...DEFAULT_PROPS} contacts={[]} total={0} />)
    expect(screen.getByText(/importa un csv/i)).toBeInTheDocument()
  })

  it('shows "no se encontraron" when search has no results', () => {
    render(<ContactsTable {...DEFAULT_PROPS} contacts={[]} total={0} searchQuery="xyz" />)
    expect(screen.getByText(/no se encontraron/i)).toBeInTheDocument()
  })

  it('shows up to 3 tags and collapses the rest', () => {
    const contact = makeContact({ tags: ['a', 'b', 'c', 'd', 'e'] })
    render(<ContactsTable {...DEFAULT_PROPS} contacts={[contact]} />)
    expect(screen.getByText('a')).toBeInTheDocument()
    expect(screen.getByText('b')).toBeInTheDocument()
    expect(screen.getByText('c')).toBeInTheDocument()
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('does not show pagination when only one page', () => {
    render(<ContactsTable {...DEFAULT_PROPS} total={50} pageSize={50} />)
    expect(screen.queryByText(/página/i)).not.toBeInTheDocument()
  })

  it('shows pagination when more than one page exists', () => {
    render(<ContactsTable {...DEFAULT_PROPS} total={120} pageSize={50} page={1} />)
    expect(screen.getByText(/página 1 de 3/i)).toBeInTheDocument()
  })
})
