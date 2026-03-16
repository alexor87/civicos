import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sidebar } from '@/components/dashboard/Sidebar'

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signOut: vi.fn().mockResolvedValue({}) },
    channel: () => ({
      on: function() { return this },
      subscribe: vi.fn(),
    }),
    removeChannel: vi.fn(),
  }),
}))

const PROPS = {
  tenantName: 'Campaña Demo',
  campaignName: 'Elecciones 2026',
  userFullName: 'Admin User',
  userRole: 'super_admin',
  userInitials: 'AU',
  campaignId: 'campaign-123',
  suggestionCount: 0,
}

describe('Sidebar', () => {
  it('muestra el nombre de la organización', () => {
    render(<Sidebar {...PROPS} />)
    expect(screen.getByText('Campaña Demo')).toBeInTheDocument()
  })

  it('muestra la campaña activa', () => {
    render(<Sidebar {...PROPS} />)
    expect(screen.getByText('Elecciones 2026')).toBeInTheDocument()
  })

  it('muestra los ítems de navegación principales', () => {
    render(<Sidebar {...PROPS} />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Contactos')).toBeInTheDocument()
    expect(screen.getByText('Canvassing')).toBeInTheDocument()
    expect(screen.getByText('Voluntarios')).toBeInTheDocument()
    expect(screen.getByText('Agentes IA')).toBeInTheDocument()
    expect(screen.getByText('Configuración')).toBeInTheDocument()
  })

  it('muestra el nombre del usuario en el footer', () => {
    render(<Sidebar {...PROPS} />)
    expect(screen.getByText('Admin User')).toBeInTheDocument()
  })

  it('muestra el label del rol', () => {
    render(<Sidebar {...PROPS} />)
    expect(screen.getByText('Super Admin')).toBeInTheDocument()
  })

  it('muestra las iniciales del usuario', () => {
    render(<Sidebar {...PROPS} />)
    expect(screen.getByText('AU')).toBeInTheDocument()
  })
})
