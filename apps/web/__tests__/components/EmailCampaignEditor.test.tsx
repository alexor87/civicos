import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EmailCampaignEditor } from '@/components/dashboard/EmailCampaignEditor'
import { createDefaultBlock } from '@/lib/email-blocks'

// next/link mock
vi.mock('next/link', () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}))

// sonner mock
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

// Mock dnd-kit — jsdom cannot simulate pointer drag events
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div data-testid="dnd-context">{children}</div>,
  DragOverlay: () => null,
  PointerSensor: class {},
  KeyboardSensor: class {},
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  closestCenter: vi.fn(),
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    isDragging: false,
  }),
  useDroppable: () => ({ isOver: false, setNodeRef: vi.fn() }),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div data-testid="sortable-context">{children}</div>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: {},
  sortableKeyboardCoordinates: {},
  arrayMove: (arr: any[], from: number, to: number) => {
    const copy = [...arr]
    const [item] = copy.splice(from, 1)
    copy.splice(to, 0, item)
    return copy
  },
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => undefined } },
}))

const SEGMENTS = [
  { id: 'seg-1', name: 'Simpatizantes Norte' },
  { id: 'seg-2', name: 'Voluntarios activos' },
]

const mockAction = vi.fn().mockResolvedValue(undefined)

// Mock fetch for /api/contacts/count
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ count: 42 }),
  }))
  mockAction.mockClear()
})

describe('EmailCampaignEditor (drag-and-drop builder)', () => {
  it('renderiza el layout de 3 paneles', () => {
    render(<EmailCampaignEditor segments={SEGMENTS} action={mockAction} />)
    // Left panel: palette
    expect(screen.getByText('Bloques')).toBeInTheDocument()
    // Left panel: settings
    expect(screen.getByText('Configuración')).toBeInTheDocument()
    // Canvas (dnd context)
    expect(screen.getByTestId('dnd-context')).toBeInTheDocument()
    // Right panel: properties
    expect(screen.getByText('Selecciona un bloque')).toBeInTheDocument()
  })

  it('muestra todos los tipos de bloque en la paleta', () => {
    render(<EmailCampaignEditor segments={SEGMENTS} action={mockAction} />)
    expect(screen.getByText('Encabezado')).toBeInTheDocument()
    expect(screen.getByText('Texto')).toBeInTheDocument()
    expect(screen.getByText('Imagen')).toBeInTheDocument()
    expect(screen.getByText('Botón')).toBeInTheDocument()
    expect(screen.getByText('Divisor')).toBeInTheDocument()
    expect(screen.getByText('Espaciador')).toBeInTheDocument()
  })

  it('muestra campos de nombre, asunto y remitente en el panel izquierdo', () => {
    render(<EmailCampaignEditor segments={SEGMENTS} action={mockAction} />)
    expect(screen.getByPlaceholderText(/Ej: Newsletter/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Ej: Únete/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/El equipo de campaña/i)).toBeInTheDocument()
  })

  it('muestra los segmentos disponibles en el selector de destinatarios', () => {
    render(<EmailCampaignEditor segments={SEGMENTS} action={mockAction} />)
    // Open the segment select to reveal options
    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)
    expect(screen.getByText('Simpatizantes Norte')).toBeInTheDocument()
    expect(screen.getByText('Voluntarios activos')).toBeInTheDocument()
  })

  it('muestra la barra de inbox con el asunto en tiempo real', async () => {
    render(<EmailCampaignEditor segments={SEGMENTS} action={mockAction} />)
    const subjectInput = screen.getByPlaceholderText(/Ej: Únete/i)
    fireEvent.change(subjectInput, { target: { value: 'Gran convocatoria 2026' } })
    expect(screen.getByText('Gran convocatoria 2026')).toBeInTheDocument()
  })

  it('muestra el botón Guardar borrador', () => {
    render(<EmailCampaignEditor segments={SEGMENTS} action={mockAction} />)
    expect(screen.getByRole('button', { name: /Guardar borrador/i })).toBeInTheDocument()
  })

  it('respeta submitLabel personalizado', () => {
    render(<EmailCampaignEditor segments={SEGMENTS} action={mockAction} submitLabel="Guardar cambios" />)
    expect(screen.getByRole('button', { name: /Guardar cambios/i })).toBeInTheDocument()
  })

  it('carga bloques iniciales desde initialData', () => {
    const header = createDefaultBlock('header')
    if (header.type === 'header') header.props.text = 'Campaña de prueba'
    render(
      <EmailCampaignEditor
        segments={SEGMENTS}
        action={mockAction}
        initialData={{ blocks: [header], meta: { name: 'Test', subject: 'Asunto test', segmentId: '', senderName: '', accentColor: '#2960ec' } }}
      />
    )
    expect(screen.getByText('Campaña de prueba')).toBeInTheDocument()
  })

  it('muestra el canvas vacío cuando no hay bloques iniciales', () => {
    render(
      <EmailCampaignEditor
        segments={SEGMENTS}
        action={mockAction}
        initialData={{ blocks: [], meta: { name: '', subject: '', segmentId: '', senderName: '', accentColor: '' } }}
      />
    )
    expect(screen.getByText(/Arrastra un bloque aquí/i)).toBeInTheDocument()
  })

  it('eliminar un bloque del canvas lo remueve de la lista', () => {
    const header = createDefaultBlock('header')
    if (header.type === 'header') header.props.text = 'Bloque para eliminar'
    render(
      <EmailCampaignEditor
        segments={SEGMENTS}
        action={mockAction}
        initialData={{ blocks: [header], meta: { name: '', subject: '', segmentId: '', senderName: '', accentColor: '' } }}
      />
    )
    // The block is rendered
    expect(screen.getByText('Bloque para eliminar')).toBeInTheDocument()
    // Click the delete button (title="Eliminar")
    const deleteBtn = screen.getByTitle('Eliminar')
    fireEvent.click(deleteBtn)
    // Block should be gone
    expect(screen.queryByText('Bloque para eliminar')).not.toBeInTheDocument()
  })

  it('seleccionar un bloque muestra su editor en el panel de propiedades', () => {
    const text = createDefaultBlock('text')
    render(
      <EmailCampaignEditor
        segments={SEGMENTS}
        action={mockAction}
        initialData={{ blocks: [text], meta: { name: '', subject: '', segmentId: '', senderName: '', accentColor: '' } }}
      />
    )
    // Click the block to select it
    const editBtn = screen.getByTitle('Editar')
    fireEvent.click(editBtn)
    // Properties panel should show the text editor
    expect(screen.getByText('Edición en el canvas')).toBeInTheDocument()
  })

  it('muestra recuento de destinatarios tras cargar', async () => {
    render(<EmailCampaignEditor segments={SEGMENTS} action={mockAction} />)
    await waitFor(() => {
      expect(screen.getByText(/42 destinatarios/i)).toBeInTheDocument()
    })
  })
})
