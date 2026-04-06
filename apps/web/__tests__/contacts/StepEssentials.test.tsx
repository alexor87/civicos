import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormProvider, useForm } from 'react-hook-form'
import { StepEssentials } from '@/components/contacts/steps/StepEssentials'
import type { ContactForm } from '@/lib/schemas/contact-form'

// Mock fetch for duplicate check
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ duplicate: false }),
})

function Wrapper({ children }: { children: React.ReactNode }) {
  const methods = useForm<ContactForm>({
    defaultValues: {
      first_name: '', last_name: '', document_type: 'CC',
      document_number: '', phone: '', status: 'unknown',
    },
  })
  return <FormProvider {...methods}>{children}</FormProvider>
}

describe('StepEssentials', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders name fields', () => {
    render(<StepEssentials campaignId="camp-1" />, { wrapper: Wrapper })
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/apellido/i)).toBeInTheDocument()
  })

  it('renders document fields', () => {
    render(<StepEssentials campaignId="camp-1" />, { wrapper: Wrapper })
    expect(screen.getByLabelText(/tipo doc/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/número de documento/i)).toBeInTheDocument()
  })

  it('renders phone field', () => {
    render(<StepEssentials campaignId="camp-1" />, { wrapper: Wrapper })
    expect(screen.getByLabelText(/teléfono móvil/i)).toBeInTheDocument()
  })

  it('renders status buttons', () => {
    render(<StepEssentials campaignId="camp-1" />, { wrapper: Wrapper })
    expect(screen.getByText('Simpatizante')).toBeInTheDocument()
    expect(screen.getByText('Indeciso')).toBeInTheDocument()
    expect(screen.getByText('Opositor')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('renders email field as required', () => {
    render(<StepEssentials campaignId="camp-1" />, { wrapper: Wrapper })
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
  })

  it('renders collapsible phone alternate section', () => {
    render(<StepEssentials campaignId="camp-1" />, { wrapper: Wrapper })
    expect(screen.getByText(/teléfono alterno/i)).toBeInTheDocument()
  })
})
