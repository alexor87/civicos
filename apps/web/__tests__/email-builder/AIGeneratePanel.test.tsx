import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/app/dashboard/contenido/generate-action', () => ({
  generateContent: vi.fn(),
}))

import { AIGeneratePanel } from '@/components/dashboard/email-builder/AIGeneratePanel'
import { generateContent } from '@/app/dashboard/contenido/generate-action'

const mockGenerateContent = generateContent as ReturnType<typeof vi.fn>

const noop = () => {}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AIGeneratePanel (inline)', () => {
  it('renders in collapsed state by default', () => {
    render(<AIGeneratePanel onApply={noop} />)
    expect(screen.getByText(/generar este email con ia/i)).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/describe/i)).not.toBeInTheDocument()
  })

  it('expands when the collapsed bar is clicked', () => {
    render(<AIGeneratePanel onApply={noop} />)
    fireEvent.click(screen.getByText(/generar este email con ia/i))
    expect(screen.getByPlaceholderText(/describe/i)).toBeInTheDocument()
  })

  it('shows prompt textarea and tone selector when expanded', () => {
    render(<AIGeneratePanel onApply={noop} />)
    fireEvent.click(screen.getByText(/generar este email con ia/i))
    expect(screen.getByPlaceholderText(/describe/i)).toBeInTheDocument()
    expect(screen.getByText(/cercano/i)).toBeInTheDocument()
  })

  it('shows loading state after clicking Generar', async () => {
    mockGenerateContent.mockImplementation(() => new Promise(() => {})) // never resolves
    render(<AIGeneratePanel onApply={noop} />)
    fireEvent.click(screen.getByText(/generar este email con ia/i))
    fireEvent.change(screen.getByPlaceholderText(/describe/i), {
      target: { value: 'Invitación al mitin del 20 de marzo' },
    })
    fireEvent.click(screen.getByRole('button', { name: /generar email/i }))
    await waitFor(() => {
      expect(screen.getByText(/analizando/i)).toBeInTheDocument()
    })
  })

  it('shows done state with "Email generado" after successful generation', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      subject: 'Únete al mitin',
      blocks: [{ id: 'ai-block-0', type: 'header', props: { text: 'Gran mitin', subtext: 'Plaza Mayor', bgColor: '#2960ec', textColor: '#ffffff', padding: 'md' } }],
    })
    render(<AIGeneratePanel onApply={noop} />)
    fireEvent.click(screen.getByText(/generar este email con ia/i))
    fireEvent.change(screen.getByPlaceholderText(/describe/i), {
      target: { value: 'Invitación al mitin' },
    })
    fireEvent.click(screen.getByRole('button', { name: /generar email/i }))
    await waitFor(() => {
      expect(screen.getByText(/email generado/i)).toBeInTheDocument()
    })
  })

  it('Regenerar button returns to expanded state', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      subject: 'Asunto',
      blocks: [],
    })
    render(<AIGeneratePanel onApply={noop} />)
    fireEvent.click(screen.getByText(/generar este email con ia/i))
    fireEvent.change(screen.getByPlaceholderText(/describe/i), {
      target: { value: 'Cualquier descripción' },
    })
    fireEvent.click(screen.getByRole('button', { name: /generar email/i }))
    await waitFor(() => screen.getByText(/email generado/i))
    fireEvent.click(screen.getByRole('button', { name: /regenerar/i }))
    expect(screen.getByPlaceholderText(/describe/i)).toBeInTheDocument()
  })
})
