import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContactProfile } from '@/components/dashboard/ContactProfile'

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
