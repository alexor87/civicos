import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MapFilterPanel } from '@/components/maps/MapFilterPanel'
import type { ContactPoint, FilterKey } from '@/components/maps/MapFilterPanel'

// MapFilterPanel uses shadcn Popover — mock to avoid portal issues in jsdom
vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? children : <div>{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div data-testid="popover-content">{children}</div>,
}))

const SAMPLE_POINTS: ContactPoint[] = [
  { id: '1', lat: 6.1, lng: -75.3, last_result: 'positive',  status: 'supporter',  vote_intention: 'si',      campaign_role: 'voluntario', electoral_priority: 'alta',  capture_source: 'canvassing' },
  { id: '2', lat: 6.2, lng: -75.4, last_result: 'negative',  status: 'opponent',   vote_intention: 'no',      campaign_role: 'donante',    electoral_priority: 'baja',  capture_source: 'web'       },
  { id: '3', lat: 6.3, lng: -75.2, last_result: 'undecided', status: 'undecided',  vote_intention: 'indeciso',campaign_role: null,         electoral_priority: 'media', capture_source: 'whatsapp'  },
]

function makeProps(overrides?: Partial<Parameters<typeof MapFilterPanel>[0]>) {
  return {
    activeDimension:    'status' as FilterKey,
    setActiveDimension: vi.fn(),
    activeValues:       [] as string[],
    setActiveValues:    vi.fn(),
    allPoints:          SAMPLE_POINTS,
    filteredCount:      SAMPLE_POINTS.length,
    ...overrides,
  }
}

describe('MapFilterPanel', () => {
  it('renderiza el selector "Ver por" con la dimensión activa', () => {
    render(<MapFilterPanel {...makeProps()} />)
    expect(screen.getByText('Ver por:')).toBeInTheDocument()
    // "Estado" appears in trigger label
    expect(screen.getAllByText('Estado').length).toBeGreaterThanOrEqual(1)
  })

  it('muestra los chips de valores de la dimensión activa con sus conteos', () => {
    render(<MapFilterPanel {...makeProps()} />)
    // With 3 points: 1 supporter, 1 opponent, 1 undecided
    expect(screen.getByText('Simpatizante')).toBeInTheDocument()
    expect(screen.getByText('Opositor')).toBeInTheDocument()
    expect(screen.getByText('Indeciso')).toBeInTheDocument()
  })

  it('muestra el contador de contactos filtrados vs total', () => {
    render(<MapFilterPanel {...makeProps({ filteredCount: 2 })} />)
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText(`/ ${SAMPLE_POINTS.length} contactos`)).toBeInTheDocument()
  })

  it('no muestra "Ver todos" cuando no hay valores activos', () => {
    render(<MapFilterPanel {...makeProps()} />)
    expect(screen.queryByText('Ver todos')).not.toBeInTheDocument()
  })

  it('muestra "Ver todos" cuando hay valores activos seleccionados', () => {
    render(<MapFilterPanel {...makeProps({ activeValues: ['supporter'] })} />)
    expect(screen.getByText('Ver todos')).toBeInTheDocument()
  })

  it('llama setActiveValues con [] al hacer clic en "Ver todos"', () => {
    const setActiveValues = vi.fn()
    render(<MapFilterPanel {...makeProps({ activeValues: ['supporter'], setActiveValues })} />)
    fireEvent.click(screen.getByText('Ver todos'))
    expect(setActiveValues).toHaveBeenCalledWith([])
  })

  it('llama setActiveValues con el valor al hacer clic en un chip', () => {
    const setActiveValues = vi.fn()
    render(<MapFilterPanel {...makeProps({ setActiveValues })} />)
    fireEvent.click(screen.getByText('Simpatizante'))
    expect(setActiveValues).toHaveBeenCalledWith(['supporter'])
  })

  it('llama setActiveValues eliminando el valor al hacer clic en chip activo', () => {
    const setActiveValues = vi.fn()
    render(<MapFilterPanel {...makeProps({ activeValues: ['supporter', 'opponent'], setActiveValues })} />)
    fireEvent.click(screen.getByText('Simpatizante'))
    expect(setActiveValues).toHaveBeenCalledWith(['opponent'])
  })

  it('muestra "Sin datos disponibles" cuando allPoints está vacío', () => {
    render(<MapFilterPanel {...makeProps({ allPoints: [] })} />)
    expect(screen.getByText('Sin datos disponibles')).toBeInTheDocument()
  })

  it('llama setActiveDimension y setActiveValues al cambiar de dimensión', () => {
    const setActiveDimension = vi.fn()
    const setActiveValues    = vi.fn()
    render(<MapFilterPanel {...makeProps({ setActiveDimension, setActiveValues })} />)
    // "Visualizar por" options are in PopoverContent (mocked inline)
    // Find "Intención de voto" option inside the dimension popover
    const options = screen.getAllByText('Intención de voto')
    fireEvent.click(options[0])
    expect(setActiveDimension).toHaveBeenCalledWith('vote_intention')
  })
})
