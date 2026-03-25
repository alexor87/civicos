import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PerfilLayout from '@/app/dashboard/perfil/layout'

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/perfil/informacion',
}))

describe('PerfilLayout', () => {
  it('renders the sidebar menu with all sections', () => {
    render(
      <PerfilLayout>
        <div>Content</div>
      </PerfilLayout>
    )
    expect(screen.getByText('Mi perfil')).toBeInTheDocument()
    expect(screen.getByText('Información personal')).toBeInTheDocument()
    expect(screen.getByText('Seguridad')).toBeInTheDocument()
    expect(screen.getByText('Notificaciones')).toBeInTheDocument()
    expect(screen.getByText('Mis campañas')).toBeInTheDocument()
    expect(screen.getByText('Preferencias')).toBeInTheDocument()
  })

  it('renders children content', () => {
    render(
      <PerfilLayout>
        <div>Test Content</div>
      </PerfilLayout>
    )
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('highlights the active section', () => {
    render(
      <PerfilLayout>
        <div>Content</div>
      </PerfilLayout>
    )
    const activeLink = screen.getByText('Información personal').closest('a')
    expect(activeLink?.className).toContain('bg-primary')
  })

  it('renders navigation links with correct hrefs', () => {
    render(
      <PerfilLayout>
        <div>Content</div>
      </PerfilLayout>
    )
    const links = screen.getAllByRole('link')
    const hrefs = links.map(l => l.getAttribute('href'))
    expect(hrefs).toContain('/dashboard/perfil/informacion')
    expect(hrefs).toContain('/dashboard/perfil/seguridad')
    expect(hrefs).toContain('/dashboard/perfil/notificaciones')
    expect(hrefs).toContain('/dashboard/perfil/campanas')
    expect(hrefs).toContain('/dashboard/perfil/preferencias')
  })
})
