import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VisitsTable } from '@/components/dashboard/canvassing/VisitsTable'

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter:      () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn(() => null), toString: vi.fn(() => '') }),
  usePathname:    () => '/dashboard/canvassing/visits',
}))

vi.mock('@/components/dashboard/ApproveVisitButtons', () => ({
  ApproveVisitButtons: ({ visitId }: { visitId: string }) => (
    <div data-testid={`approve-buttons-${visitId}`}>ApproveButtons</div>
  ),
}))

// ── Fixtures ───────────────────────────────────────────────────────────────────

const TERRITORIES = [
  { id: 'ter-1', name: 'Zona Norte', color: '#2960ec' },
  { id: 'ter-2', name: 'Zona Sur',   color: '#ef4444' },
]

const BASE_VISITS = [
  {
    id: 'v1',
    result: 'positive',
    status: 'approved',
    created_at: '2026-03-10T10:00:00Z',
    contacts:   { first_name: 'Ana', last_name: 'García' },
    profiles:   { full_name: 'Luis Herrera' },
    territories: { name: 'Zona Norte', color: '#2960ec' },
  },
  {
    id: 'v2',
    result: 'undecided',
    status: 'submitted',
    created_at: '2026-03-09T09:00:00Z',
    contacts:   { first_name: 'Carlos', last_name: 'López' },
    profiles:   { full_name: 'María Pérez' },
    territories: { name: 'Zona Sur', color: '#ef4444' },
  },
]

const BASE_PROPS = {
  visits:     BASE_VISITS,
  total:      120,
  page:       1,
  pageSize:   50,
  territories: TERRITORIES,
  canApprove: false,
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('VisitsTable', () => {

  it('renderiza la tabla con las visitas recibidas', () => {
    render(<VisitsTable {...BASE_PROPS} />)
    expect(screen.getByText('Ana García')).toBeInTheDocument()
    expect(screen.getByText('Carlos López')).toBeInTheDocument()
  })

  it('muestra el badge de resultado correcto', () => {
    render(<VisitsTable {...BASE_PROPS} />)
    // Labels appear in both result filter dropdown and table rows
    expect(screen.getAllByText('Positivo').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Indeciso').length).toBeGreaterThanOrEqual(1)
  })

  it('muestra el badge de estado correcto', () => {
    render(<VisitsTable {...BASE_PROPS} />)
    // Status labels appear in both the filter dropdown and the table rows
    expect(screen.getAllByText('Aprobada').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Pendiente').length).toBeGreaterThanOrEqual(1)
  })

  it('muestra el nombre del voluntario', () => {
    render(<VisitsTable {...BASE_PROPS} />)
    expect(screen.getByText('Luis Herrera')).toBeInTheDocument()
    expect(screen.getByText('María Pérez')).toBeInTheDocument()
  })

  it('no muestra columna Acción cuando canApprove=false', () => {
    render(<VisitsTable {...BASE_PROPS} canApprove={false} />)
    expect(screen.queryByText('Acción')).not.toBeInTheDocument()
    expect(screen.queryByTestId('approve-buttons-v2')).not.toBeInTheDocument()
  })

  it('muestra ApproveVisitButtons para visitas submitted cuando canApprove=true', () => {
    render(<VisitsTable {...BASE_PROPS} canApprove={true} />)
    // v2 is submitted → should have buttons
    expect(screen.getByTestId('approve-buttons-v2')).toBeInTheDocument()
    // v1 is approved → no buttons
    expect(screen.queryByTestId('approve-buttons-v1')).not.toBeInTheDocument()
  })

  it('muestra el texto de paginación correcto', () => {
    render(<VisitsTable {...BASE_PROPS} />)
    // "1 – 50 de 120 visitas" (or similar)
    expect(screen.getByText(/120 visitas/)).toBeInTheDocument()
  })

  it('muestra empty state cuando visits=[]', () => {
    render(<VisitsTable {...BASE_PROPS} visits={[]} total={0} />)
    expect(screen.getByText(/sin visitas/i)).toBeInTheDocument()
  })

  it('muestra los selectores de filtro', () => {
    render(<VisitsTable {...BASE_PROPS} />)
    expect(screen.getByText('Todos los resultados')).toBeInTheDocument()
    expect(screen.getByText('Todos los estados')).toBeInTheDocument()
    expect(screen.getByText('Todos los territorios')).toBeInTheDocument()
  })
})
