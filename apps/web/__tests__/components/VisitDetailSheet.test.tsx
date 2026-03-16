import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VisitDetailSheet, type VisitRow } from '@/components/dashboard/canvassing/VisitDetailSheet'

// Mock shadcn Sheet to render inline (avoids portal/animation issues in jsdom)
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="sheet">{children}</div> : null,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetHeader:  ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle:   ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}))

const BASE_VISIT: VisitRow = {
  id:                 'v-001',
  result:             'contacted',
  notes:              null,
  attempt_number:     1,
  sympathy_level:     4,
  vote_intention:     'probably_us',
  persuadability:     'high',
  wants_to_volunteer: false,
  wants_to_donate:    false,
  wants_more_info:    false,
  wants_yard_sign:    false,
  requested_followup: false,
  followup_channel:   null,
  followup_notes:     null,
  best_contact_time:  null,
  household_size:     null,
  household_voters:   null,
  address_confirmed:  true,
  address_notes:      null,
  status:             'submitted',
  rejection_reason:   null,
  created_at:         '2026-03-10T14:00:00Z',
  contacts:           { first_name: 'Ana', last_name: 'García' },
  profiles:           { full_name: 'Voluntario Demo' },
  territories:        { name: 'Barrio El Centro' },
}

function render_sheet(visit: VisitRow | null = BASE_VISIT, canApprove = true) {
  return render(
    <VisitDetailSheet visit={visit} onClose={vi.fn()} canApprove={canApprove} />
  )
}

describe('VisitDetailSheet', () => {
  it('no renderiza nada cuando visit es null', () => {
    const { container } = render_sheet(null)
    expect(container.querySelector('[data-testid="sheet"]')).toBeNull()
  })

  it('muestra el nombre del contacto', () => {
    render_sheet()
    expect(screen.getByText('Ana García')).toBeInTheDocument()
  })

  it('muestra el resultado con badge', () => {
    render_sheet()
    expect(screen.getByText('Contactado')).toBeInTheDocument()
  })

  it('muestra el nombre del voluntario', () => {
    render_sheet()
    expect(screen.getByText('Voluntario Demo')).toBeInTheDocument()
  })

  it('muestra el territorio', () => {
    render_sheet()
    expect(screen.getByText('Barrio El Centro')).toBeInTheDocument()
  })

  it('muestra sección de perfil si result es contacted', () => {
    render_sheet()
    expect(screen.getByText('Probablemente nos vota')).toBeInTheDocument()
    expect(screen.getByText('Alta')).toBeInTheDocument()
  })

  it('NO muestra sección de perfil si result es no_home', () => {
    render_sheet({ ...BASE_VISIT, result: 'no_home', sympathy_level: null, vote_intention: null, persuadability: null })
    expect(screen.queryByText('Probablemente nos vota')).not.toBeInTheDocument()
  })

  it('muestra intereses si alguno es true', () => {
    render_sheet({ ...BASE_VISIT, wants_to_volunteer: true, wants_to_donate: true })
    expect(screen.getByText('Quiere voluntariar')).toBeInTheDocument()
    expect(screen.getByText('Quiere donar')).toBeInTheDocument()
  })

  it('NO muestra sección de intereses si todos son false', () => {
    render_sheet()
    expect(screen.queryByText('Quiere voluntariar')).not.toBeInTheDocument()
  })

  it('muestra botones de aprobación si canApprove y status submitted', () => {
    render_sheet()
    expect(screen.getByText('Aprobar visita')).toBeInTheDocument()
    expect(screen.getByText('Rechazar')).toBeInTheDocument()
  })

  it('NO muestra botones de aprobación si status es approved', () => {
    render_sheet({ ...BASE_VISIT, status: 'approved' })
    expect(screen.queryByText('Aprobar visita')).not.toBeInTheDocument()
  })

  it('NO muestra botones de aprobación si canApprove es false', () => {
    render_sheet(BASE_VISIT, false)
    expect(screen.queryByText('Aprobar visita')).not.toBeInTheDocument()
  })

  it('muestra input de motivo al hacer clic en Rechazar', () => {
    render_sheet()
    fireEvent.click(screen.getByText('Rechazar'))
    expect(screen.getByPlaceholderText(/describe por qué/i)).toBeInTheDocument()
    expect(screen.getByText('Confirmar rechazo')).toBeInTheDocument()
  })

  it('muestra seguimiento si requested_followup es true', () => {
    render_sheet({ ...BASE_VISIT, requested_followup: true, followup_channel: 'whatsapp', best_contact_time: 'Tardes' })
    expect(screen.getByText('Seguimiento solicitado')).toBeInTheDocument()
    expect(screen.getByText('WhatsApp')).toBeInTheDocument()
    expect(screen.getByText('Tardes')).toBeInTheDocument()
  })

  it('muestra notas de la visita si existen', () => {
    render_sheet({ ...BASE_VISIT, notes: 'Estaba muy interesado en la propuesta' })
    expect(screen.getByText('Estaba muy interesado en la propuesta')).toBeInTheDocument()
  })
})
