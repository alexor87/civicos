import { describe, it, expect, vi } from 'vitest'

// Mock modules before imports
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard/contacts/contact-1/edit',
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { initial, animate, exit, transition, ...rest } = props
      return <div {...rest}>{children as React.ReactNode}</div>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/contacts/ContactGeoSelector', () => ({
  ContactGeoSelector: () => <div data-testid="geo-selector">GeoSelector</div>,
}))

const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: (...args: unknown[]) => mockFrom(...args),
  })),
}))

import { render, screen } from '@testing-library/react'
import EditContactPage from '@/app/dashboard/contacts/[id]/edit/page'

// Setup mock chain: profiles → campaign_ids, contacts → contact data
mockFrom.mockImplementation((table: string) => {
  if (table === 'profiles') {
    return {
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: { campaign_ids: ['camp-1'] },
          }),
        }),
      }),
    }
  }
  if (table === 'contacts') {
    return {
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: {
              id: 'contact-1',
              first_name: 'Ana',
              last_name: 'Gómez',
              phone: '3001234567',
              email: 'ana@test.com',
              status: 'supporter',
              document_type: 'CC',
              document_number: '1234567890',
              city: 'Medellín',
              district: 'El Poblado',
              address: 'Calle 10',
              tags: ['VIP', 'líder'],
              notes: 'Nota de prueba',
              metadata: {
                political_affinity: 4,
                vote_intention: 'yes',
                campaign_role: 'coordinador',
                preferred_party: 'Alianza Verde',
              },
            },
          }),
        }),
      }),
    }
  }
  return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }) }
})

describe('Edit Contact Page', () => {
  it('renders the wizard with contact name', async () => {
    const page = await EditContactPage({ params: Promise.resolve({ id: 'contact-1' }) })
    render(page)
    expect(screen.getByText('Editar Contacto')).toBeInTheDocument()
    expect(screen.getByText('Ana Gómez')).toBeInTheDocument()
  })

  it('renders step 1 (Datos básicos) by default', async () => {
    const page = await EditContactPage({ params: Promise.resolve({ id: 'contact-1' }) })
    render(page)
    expect(screen.getByText('Datos básicos')).toBeInTheDocument()
  })

  it('renders back link to profile', async () => {
    const page = await EditContactPage({ params: Promise.resolve({ id: 'contact-1' }) })
    render(page)
    expect(screen.getByText('Volver al perfil')).toBeInTheDocument()
  })
})
