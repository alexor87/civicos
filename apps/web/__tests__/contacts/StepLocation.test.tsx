import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormProvider, useForm } from 'react-hook-form'
import { StepLocation } from '@/components/contacts/steps/StepLocation'
import type { ContactForm } from '@/lib/schemas/contact-form'

// Mock GeoSelector
vi.mock('@/components/perfil/GeoSelector', () => ({
  GeoSelector: () => <div data-testid="geo-selector">GeoSelector Mock</div>,
}))

// Mock fetch for geo data
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ ciudades: [] }),
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

describe('StepLocation', () => {
  it('renders address field', () => {
    render(<StepLocation />, { wrapper: Wrapper })
    expect(screen.getByLabelText(/dirección/i)).toBeInTheDocument()
  })

  it('renders voting place field', () => {
    render(<StepLocation />, { wrapper: Wrapper })
    expect(screen.getByLabelText(/puesto de votación/i)).toBeInTheDocument()
  })

  it('renders voting table field', () => {
    render(<StepLocation />, { wrapper: Wrapper })
    expect(screen.getByLabelText(/mesa/i)).toBeInTheDocument()
  })
})
