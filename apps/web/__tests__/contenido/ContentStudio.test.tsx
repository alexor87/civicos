import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/app/dashboard/contenido/generate-action', () => ({
  generateContent: vi.fn(),
}))

import { ContentStudio } from '@/components/dashboard/contenido/ContentStudio'
import { generateContent } from '@/app/dashboard/contenido/generate-action'

const mockGenerateContent = generateContent as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ContentStudio', () => {
  it('renders the 4 content type tabs', () => {
    render(<ContentStudio />)
    expect(screen.getByRole('tab', { name: /email/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /script/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /sms/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /talking points/i })).toBeInTheDocument()
  })

  it('renders the prompt textarea', () => {
    render(<ContentStudio />)
    expect(screen.getByPlaceholderText(/describe/i)).toBeInTheDocument()
  })

  it('renders the tone selector with default value', () => {
    render(<ContentStudio />)
    // Default tone is 'cercano' — the SelectTrigger shows the current value
    expect(screen.getByText(/cercano/i)).toBeInTheDocument()
  })

  it('shows loading state when Generar button is clicked', async () => {
    mockGenerateContent.mockImplementation(() => new Promise(() => {})) // never resolves
    render(<ContentStudio />)

    fireEvent.change(screen.getByPlaceholderText(/describe/i), {
      target: { value: 'Invitación al mitin del 20 de marzo' },
    })

    fireEvent.click(screen.getByRole('button', { name: /generar/i }))
    await waitFor(() => {
      expect(screen.getByText(/generando/i)).toBeInTheDocument()
    })
  })

  it('shows generated email subject when action returns content', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      subject: 'Únete al mitin del 20 de marzo',
      blocks: [{ id: 'ai-block-0', type: 'header', props: { text: 'Gran mitin', subtext: 'Plaza Mayor', bgColor: '#2960ec', textColor: '#ffffff', padding: 'md' } }],
    })
    render(<ContentStudio />)

    fireEvent.change(screen.getByPlaceholderText(/describe/i), {
      target: { value: 'Invitación al mitin' },
    })

    fireEvent.click(screen.getByRole('button', { name: /generar/i }))
    await waitFor(() => {
      expect(screen.getByText('Únete al mitin del 20 de marzo')).toBeInTheDocument()
    })
  })
})
