import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { AISuggestionsPanel } from '@/components/dashboard/AISuggestionsPanel'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock('@/lib/types/database', () => ({}))

vi.mock('@/components/dashboard/ai/AgentTriggerButtons', () => ({
  AgentTriggerButtons: () => <div data-testid="agent-trigger-buttons" />,
}))

vi.mock('@/components/dashboard/ai/ThresholdsConfigForm', () => ({
  ThresholdsConfigForm: () => <div data-testid="thresholds-config-form" />,
}))

vi.mock('@/components/dashboard/ai/AIChatPanel', () => ({
  AIChatPanel: () => <div data-testid="ai-chat-panel" />,
}))

// Mock Supabase client used by Realtime subscription in AISuggestionsPanel
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    channel: vi.fn(() => ({
      on:        vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  })),
}))

// ── Test data helpers ─────────────────────────────────────────────────────────

function makeSuggestion(overrides = {}) {
  return {
    id: 'sug-1',
    title: 'Contactar simpatizantes inactivos',
    description: 'Hay 50 simpatizantes sin interacción en 30 días',
    priority: 'medium',
    module: 'crm',
    status: 'active',
    reasoning: 'Análisis de engagement',
    estimated_impact: 'Recuperar 30% de simpatizantes',
    type: 'engagement',
    created_at: '2026-03-08T00:00:00Z',
    updated_at: '2026-03-08T00:00:00Z',
    tenant_id: 't1',
    campaign_id: 'c1',
    agent_id: 'agent-1',
    action_payload: null,
    applied_at: null,
    dismissed_at: null,
    feedback: null,
    ...overrides,
  }
}

function makeAgentRun(overrides = {}) {
  return {
    id: 'run-1',
    agent_id: 'agent-welcome-contact',
    status: 'completed',
    trigger: 'contact_created:123',
    created_at: '2026-03-08T00:00:00Z',
    updated_at: '2026-03-08T00:00:00Z',
    tenant_id: 't1',
    campaign_id: 'c1',
    workflow_id: 'w1',
    steps: null,
    result: null,
    error: null,
    completed_at: null,
    ...overrides,
  }
}

const DEFAULT_PROPS = {
  suggestions: [],
  history: [],
  agentRuns: [],
  campaignId: 'c1',
  userRole: 'admin',
  campaignName: 'Campaña Test',
  thresholds: {
    visit_drop_pct: 20,
    coverage_low_pct: 40,
    inactive_volunteers_min: 3,
    inactive_contact_days: 30,
    stale_draft_days: 7,
  },
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  global.fetch = vi.fn()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AISuggestionsPanel', () => {
  // 1. Renders tabs navigation
  it('renders tabs navigation', () => {
    render(<AISuggestionsPanel {...DEFAULT_PROPS} />)
    expect(screen.getByText('Sugerencias')).toBeInTheDocument()
    expect(screen.getByText('Agentes IA')).toBeInTheDocument()
  })

  // 2. Shows badge count on Sugerencias tab when there are active suggestions
  it('shows badge count on Sugerencias tab when there are suggestions', () => {
    const suggestions = [makeSuggestion(), makeSuggestion({ id: 'sug-2' })]
    render(<AISuggestionsPanel {...DEFAULT_PROPS} suggestions={suggestions} />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  // 3. Shows empty state when no suggestions
  it('shows empty state when suggestions array is empty', () => {
    render(<AISuggestionsPanel {...DEFAULT_PROPS} suggestions={[]} />)
    expect(screen.getByText('No hay sugerencias activas en este momento')).toBeInTheDocument()
  })

  // 4. Renders suggestion title and description
  it('renders suggestion title and description', () => {
    const suggestion = makeSuggestion()
    render(<AISuggestionsPanel {...DEFAULT_PROPS} suggestions={[suggestion]} />)
    expect(screen.getByText('Contactar simpatizantes inactivos')).toBeInTheDocument()
    expect(screen.getByText('Hay 50 simpatizantes sin interacción en 30 días')).toBeInTheDocument()
  })

  // 5. Groups critical suggestions under "Críticas" section
  it('groups critical suggestions under Críticas section', () => {
    const suggestion = makeSuggestion({ id: 'sug-crit', priority: 'critical' })
    render(<AISuggestionsPanel {...DEFAULT_PROPS} suggestions={[suggestion]} />)
    expect(screen.getByText(/Críticas/)).toBeInTheDocument()
  })

  // 6. Groups high priority suggestions under "Prioridad alta" section
  it('groups high priority suggestions under Prioridad alta section', () => {
    const suggestion = makeSuggestion({ id: 'sug-high', priority: 'high' })
    render(<AISuggestionsPanel {...DEFAULT_PROPS} suggestions={[suggestion]} />)
    expect(screen.getByText(/Prioridad alta/)).toBeInTheDocument()
  })

  // 7. Aplicar button calls PATCH with action=approved and removes from list on success
  it('Aplicar button calls PATCH with action=approved and removes suggestion on success', async () => {
    const mockToastSuccess = (await import('sonner')).toast.success
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true })

    const suggestion = makeSuggestion({ id: 'sug-1' })
    render(<AISuggestionsPanel {...DEFAULT_PROPS} suggestions={[suggestion]} />)

    const applyButton = screen.getByText('Aplicar')

    await act(async () => {
      fireEvent.click(applyButton)
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/suggestions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'sug-1', action: 'approved' }),
      })
    })

    await waitFor(() => {
      expect(screen.getByText('No hay sugerencias activas en este momento')).toBeInTheDocument()
    })

    expect(mockToastSuccess).toHaveBeenCalledWith('Sugerencia aplicada')
  })

  // 8. Descartar button calls PATCH with action=dismissed and removes from list on success
  it('Descartar button calls PATCH with action=dismissed and removes suggestion on success', async () => {
    const mockToastSuccess = (await import('sonner')).toast.success
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true })

    const suggestion = makeSuggestion({ id: 'sug-1' })
    render(<AISuggestionsPanel {...DEFAULT_PROPS} suggestions={[suggestion]} />)

    const dismissButton = screen.getByText('Descartar')

    await act(async () => {
      fireEvent.click(dismissButton)
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/suggestions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'sug-1', action: 'dismissed' }),
      })
    })

    await waitFor(() => {
      expect(screen.getByText('No hay sugerencias activas en este momento')).toBeInTheDocument()
    })

    expect(mockToastSuccess).toHaveBeenCalledWith('Sugerencia descartada')
  })

  // 9. Shows error toast when PATCH fails
  it('shows error toast when PATCH fails', async () => {
    const mockToastError = (await import('sonner')).toast.error
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false })

    const suggestion = makeSuggestion({ id: 'sug-1' })
    render(<AISuggestionsPanel {...DEFAULT_PROPS} suggestions={[suggestion]} />)

    const applyButton = screen.getByText('Aplicar')

    await act(async () => {
      fireEvent.click(applyButton)
    })

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Error al procesar la acción')
    })

    // Suggestion should still be in the list
    expect(screen.getByText('Contactar simpatizantes inactivos')).toBeInTheDocument()
  })

  // 10. Agentes tab: empty state when agentRuns is empty
  it('Agentes tab shows empty state when agentRuns is empty', () => {
    render(<AISuggestionsPanel {...DEFAULT_PROPS} agentRuns={[]} />)

    fireEvent.click(screen.getByText('Agentes IA'))

    expect(screen.getByText('Sin actividad de agentes aún')).toBeInTheDocument()
  })

  // 11. Agentes tab: shows agent_id and status for each run
  it('Agentes tab shows agent_id and status for each run', () => {
    const run = makeAgentRun()
    render(<AISuggestionsPanel {...DEFAULT_PROPS} agentRuns={[run]} />)

    fireEvent.click(screen.getByText('Agentes IA'))

    expect(screen.getByText('agent-welcome-contact')).toBeInTheDocument()
    expect(screen.getByText('completed')).toBeInTheDocument()
  })

  // 12. Historial tab: empty state when history is empty
  it('Historial tab shows empty state when history is empty', () => {
    render(<AISuggestionsPanel {...DEFAULT_PROPS} history={[]} />)

    fireEvent.click(screen.getByText('Historial'))

    expect(screen.getByText('Sin historial aún')).toBeInTheDocument()
  })

  // 13. Historial tab: renders history items with title and status badge
  it('Historial tab renders history item title and status badge', () => {
    const historySuggestion = makeSuggestion({
      id: 'hist-1',
      title: 'Enviar campaña de reactivación',
      status: 'applied',
    })
    render(<AISuggestionsPanel {...DEFAULT_PROPS} history={[historySuggestion]} />)

    fireEvent.click(screen.getByText('Historial'))

    expect(screen.getByText('Enviar campaña de reactivación')).toBeInTheDocument()
    expect(screen.getByText('applied')).toBeInTheDocument()
  })
})
