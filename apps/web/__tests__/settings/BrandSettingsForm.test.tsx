import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrandSettingsForm } from '@/components/settings/BrandSettingsForm'

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/components/settings/BrandColorsForm', () => ({
  BRAND_PALETTES: [
    { id: 'azul', name: 'Azul Institucional', category: 'Clásicas', color_primary: '#2960ec', color_secondary: '#1e293b', color_accent: '#ea580c', color_background: '#f8fafc', color_surface: '#ffffff' },
    { id: 'verde', name: 'Verde Esperanza', category: 'Modernas', color_primary: '#16a34a', color_secondary: '#14532d', color_accent: '#f59e0b', color_background: '#f0fdf4', color_surface: '#ffffff' },
  ],
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

const INITIAL: Parameters<typeof BrandSettingsForm>[0]['initial'] = {
  logo_url: null,
  candidate_photo_url: null,
  candidate_name: 'María López',
  candidate_role: 'Alcaldía',
  slogan: 'Juntos',
  color_primary: '#2960ec',
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('BrandSettingsForm', () => {
  it('renderiza section headers en sentence case (no uppercase)', () => {
    render(<BrandSettingsForm initial={INITIAL} />)
    const headers = screen.getAllByRole('heading', { level: 3 })
    headers.forEach(h => {
      expect(h.className).toContain('tracking-normal')
      expect(h.className).not.toContain('uppercase')
    })
  })

  it('muestra las tabs de preview: Panel lateral, Dashboard, Login', () => {
    render(<BrandSettingsForm initial={INITIAL} />)
    expect(screen.getByText('Panel lateral')).toBeInTheDocument()
    // Dashboard appears in preview tab and in sidebar nav preview
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Login')).toBeInTheDocument()
  })

  it('cambia de preview tab al hacer click', () => {
    render(<BrandSettingsForm initial={INITIAL} />)
    // Find the tab button specifically
    const dashboardButtons = screen.getAllByText('Dashboard')
    const tabButton = dashboardButtons.find(el => el.tagName === 'BUTTON')
    if (tabButton) fireEvent.click(tabButton)
    // Dashboard preview shows mini KPI cards
    expect(screen.getByText('1,247')).toBeInTheDocument()
  })

  it('muestra nombre del candidato en el preview', () => {
    render(<BrandSettingsForm initial={INITIAL} />)
    expect(screen.getAllByText('María López').length).toBeGreaterThanOrEqual(1)
  })

  it('muestra categorías de paletas: Clásicas, Modernas, Colombia', () => {
    render(<BrandSettingsForm initial={INITIAL} />)
    expect(screen.getByText('Clásicas')).toBeInTheDocument()
    expect(screen.getByText('Modernas')).toBeInTheDocument()
    expect(screen.getByText('Colombia')).toBeInTheDocument()
  })

  it('muestra contador de caracteres del eslogan', () => {
    render(<BrandSettingsForm initial={INITIAL} />)
    expect(screen.getByText(/6\/80/)).toBeInTheDocument()
  })

  it('tiene botón de guardar', () => {
    render(<BrandSettingsForm initial={INITIAL} />)
    expect(screen.getByRole('button', { name: /guardar marca/i })).toBeInTheDocument()
  })
})
