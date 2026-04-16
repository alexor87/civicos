import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormProvider, useForm } from 'react-hook-form'
import { StepPolitical } from '@/components/contacts/steps/StepPolitical'
import type { ContactForm } from '@/lib/schemas/contact-form'

function Wrapper({ children }: { children: React.ReactNode }) {
  const methods = useForm<ContactForm>({
    defaultValues: {
      first_name: '', last_name: '', document_type: 'CC',
      document_number: '', phone: '', status: 'unknown',
    },
  })
  return <FormProvider {...methods}>{children}</FormProvider>
}

describe('StepPolitical', () => {
  it('renders affinity selector', () => {
    render(<StepPolitical />, { wrapper: Wrapper })
    expect(screen.getByText('Opositor')).toBeInTheDocument()
    expect(screen.getByText('Aliado')).toBeInTheDocument()
  })

  it('renders vote intention selector', () => {
    render(<StepPolitical />, { wrapper: Wrapper })
    expect(screen.getByText(/Sí, votará/)).toBeInTheDocument()
    expect(screen.getByText('Indeciso')).toBeInTheDocument()
  })

  it('renders electoral priority buttons', () => {
    render(<StepPolitical />, { wrapper: Wrapper })
    expect(screen.getByText('Alta')).toBeInTheDocument()
    expect(screen.getByText('Media')).toBeInTheDocument()
    expect(screen.getByText('Baja')).toBeInTheDocument()
  })

  it('renders campaign role select', () => {
    render(<StepPolitical />, { wrapper: Wrapper })
    expect(screen.getByLabelText(/rol en campaña/i)).toBeInTheDocument()
  })
})
