import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TeamMembersClient } from '@/components/settings/TeamMembersClient'

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock('@/components/settings/InviteMemberModal', () => ({
  InviteMemberModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="invite-modal">InviteModal</div> : null,
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

// ── Fixtures ───────────────────────────────────────────────────────────────────

const MEMBERS = [
  { id: 'u1', full_name: 'Ana García',  email: 'ana@test.com',   role: 'super_admin',       created_at: '2026-01-01T00:00:00Z' },
  { id: 'u2', full_name: 'Carlos Ruiz', email: 'carlos@test.com', role: 'volunteer',         created_at: '2026-02-01T00:00:00Z' },
  { id: 'u3', full_name: 'Diana López', email: 'diana@test.com',  role: 'field_coordinator', created_at: '2026-03-01T00:00:00Z' },
]

const DEFAULT_PROPS = {
  members: MEMBERS,
  currentUserId: 'u1',
  canManage: true,
  tenantId: 't1',
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('TeamMembersClient', () => {
  beforeEach(() => { mockFetch.mockReset() })

  it('renderiza la tabla con nombres, emails y roles', () => {
    render(<TeamMembersClient {...DEFAULT_PROPS} />)
    expect(screen.getByText('Ana García')).toBeInTheDocument()
    expect(screen.getByText('carlos@test.com')).toBeInTheDocument()
    expect(screen.getByText('Voluntario')).toBeInTheDocument()
    expect(screen.getByText('Coordinador de Terreno')).toBeInTheDocument()
  })

  it('muestra "(tú)" junto al usuario actual', () => {
    render(<TeamMembersClient {...DEFAULT_PROPS} />)
    expect(screen.getByText('(tú)')).toBeInTheDocument()
  })

  it('muestra estado vacío cuando no hay miembros', () => {
    render(<TeamMembersClient {...DEFAULT_PROPS} members={[]} />)
    expect(screen.getByText(/construye tu equipo/i)).toBeInTheDocument()
    expect(screen.getByText(/invitar primer miembro/i)).toBeInTheDocument()
  })

  it('muestra el botón invitar cuando canManage=true', () => {
    render(<TeamMembersClient {...DEFAULT_PROPS} />)
    expect(screen.getByRole('button', { name: /invitar miembro/i })).toBeInTheDocument()
  })

  it('oculta el botón invitar cuando canManage=false', () => {
    render(<TeamMembersClient {...DEFAULT_PROPS} canManage={false} />)
    expect(screen.queryByRole('button', { name: /invitar miembro/i })).not.toBeInTheDocument()
  })

  it('abre el modal de invitación al hacer click', () => {
    render(<TeamMembersClient {...DEFAULT_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /invitar miembro/i }))
    expect(screen.getByTestId('invite-modal')).toBeInTheDocument()
  })

  it('muestra el conteo de miembros', () => {
    render(<TeamMembersClient {...DEFAULT_PROPS} />)
    expect(screen.getByText(/3 personas/i)).toBeInTheDocument()
  })

  it('no muestra búsqueda con <= 5 miembros', () => {
    render(<TeamMembersClient {...DEFAULT_PROPS} />)
    expect(screen.queryByPlaceholderText(/buscar/i)).not.toBeInTheDocument()
  })

  it('muestra búsqueda con > 5 miembros', () => {
    const sixMembers = [
      ...MEMBERS,
      { id: 'u4', full_name: 'Eva M.',    email: 'eva@t.com',    role: 'volunteer', created_at: '2026-03-01T00:00:00Z' },
      { id: 'u5', full_name: 'Felipe R.', email: 'felipe@t.com', role: 'analyst',   created_at: '2026-03-01T00:00:00Z' },
      { id: 'u6', full_name: 'Gina S.',   email: 'gina@t.com',   role: 'volunteer', created_at: '2026-03-01T00:00:00Z' },
    ]
    render(<TeamMembersClient {...DEFAULT_PROPS} members={sixMembers} />)
    expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument()
  })

  it('filtra miembros al buscar', () => {
    const sixMembers = [
      ...MEMBERS,
      { id: 'u4', full_name: 'Eva M.',    email: 'eva@t.com',    role: 'volunteer', created_at: '2026-03-01T00:00:00Z' },
      { id: 'u5', full_name: 'Felipe R.', email: 'felipe@t.com', role: 'analyst',   created_at: '2026-03-01T00:00:00Z' },
      { id: 'u6', full_name: 'Gina S.',   email: 'gina@t.com',   role: 'volunteer', created_at: '2026-03-01T00:00:00Z' },
    ]
    render(<TeamMembersClient {...DEFAULT_PROPS} members={sixMembers} />)
    fireEvent.change(screen.getByPlaceholderText(/buscar/i), { target: { value: 'Diana' } })
    expect(screen.getByText('Diana López')).toBeInTheDocument()
    expect(screen.queryByText('Ana García')).not.toBeInTheDocument()
  })
})
