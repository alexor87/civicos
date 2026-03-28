import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { PermissionsProvider } from '@/components/providers/PermissionsProvider'

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

function renderSidebar(props = PROPS) {
  return render(
    <PermissionsProvider userRole={props.userRole} customRoleId={null} tenantId="t1">
      <Sidebar {...props} />
    </PermissionsProvider>
  )
}

describe('Sidebar', () => {
  it('muestra el nombre de la organización', () => {
    renderSidebar()
    expect(screen.getByText('Campaña Demo')).toBeInTheDocument()
  })

  it('muestra la campaña activa', () => {
    renderSidebar()
    expect(screen.getByText('Elecciones 2026')).toBeInTheDocument()
  })

  it('muestra los ítems de navegación principales', () => {
    renderSidebar()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Contactos')).toBeInTheDocument()
    expect(screen.getAllByText('Territorio').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Voluntarios')).toBeInTheDocument()
    expect(screen.getByText('Operaciones')).toBeInTheDocument()
    expect(screen.getByText('Agentes IA')).toBeInTheDocument()
  })

  it('muestra el enlace a configuración en el footer', () => {
    renderSidebar()
    const link = screen.getByRole('link', { name: /configuraci/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/dashboard/settings')
  })

  it('muestra el botón de colapsar sidebar', () => {
    renderSidebar()
    expect(screen.getByRole('button', { name: /colapsar/i })).toBeInTheDocument()
  })

  it('colapsa el sidebar al hacer click en el botón', async () => {
    const { fireEvent } = await import('@testing-library/react')
    renderSidebar()
    const btn = screen.getByRole('button', { name: /colapsar/i })
    fireEvent.click(btn)
    // After collapse, nav labels should be hidden
    expect(screen.queryByText('Contactos')).not.toBeInTheDocument()
    // Expand button should now appear
    expect(screen.getByRole('button', { name: /expandir/i })).toBeInTheDocument()
  })
})
