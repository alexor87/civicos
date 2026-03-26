import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ApiKeysManager } from '@/components/settings/ApiKeysManager'

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const KEY_ACTIVE = {
  id:           'key-1',
  name:         'Test Key',
  key_prefix:   'cvk_test',
  scopes:       ['contacts:read'],
  created_at:   '2026-01-01T00:00:00Z',
  last_used_at: '2026-03-15T10:00:00Z',
  revoked_at:   null,
}

const KEY_REVOKED = {
  ...KEY_ACTIVE,
  id: 'key-2',
  name: 'Old Key',
  revoked_at: '2026-02-01T00:00:00Z',
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('ApiKeysManager', () => {
  beforeEach(() => { mockFetch.mockReset() })

  it('muestra estado vacío cuando no hay keys', () => {
    render(<ApiKeysManager initialKeys={[]} canManage={true} />)
    expect(screen.getByText(/no hay api keys creadas/i)).toBeInTheDocument()
  })

  it('muestra botón "Nueva API key" solo si canManage', () => {
    const { rerender } = render(<ApiKeysManager initialKeys={[]} canManage={true} />)
    expect(screen.getByRole('button', { name: /nueva api key/i })).toBeInTheDocument()

    rerender(<ApiKeysManager initialKeys={[]} canManage={false} />)
    expect(screen.queryByRole('button', { name: /nueva api key/i })).not.toBeInTheDocument()
  })

  it('renderiza keys activas con nombre, prefijo y scopes', () => {
    render(<ApiKeysManager initialKeys={[KEY_ACTIVE]} canManage={true} />)
    expect(screen.getByText('Test Key')).toBeInTheDocument()
    expect(screen.getByText('cvk_test••••')).toBeInTheDocument()
    expect(screen.getByText('contacts:read')).toBeInTheDocument()
  })

  it('muestra badge "Revocada" para keys revocadas', () => {
    render(<ApiKeysManager initialKeys={[KEY_REVOKED]} canManage={true} />)
    expect(screen.getByText('Revocada')).toBeInTheDocument()
  })

  it('el diálogo de crear incluye selector de expiración', () => {
    render(<ApiKeysManager initialKeys={[]} canManage={true} />)
    fireEvent.click(screen.getByRole('button', { name: /nueva api key/i }))
    expect(screen.getByLabelText(/expiración/i)).toBeInTheDocument()
    expect(screen.getByText('30 días')).toBeInTheDocument()
    expect(screen.getByText('90 días')).toBeInTheDocument()
    expect(screen.getByText('1 año')).toBeInTheDocument()
    expect(screen.getByText('Sin expiración')).toBeInTheDocument()
  })

  it('el diálogo de crear muestra descripciones de scopes', () => {
    render(<ApiKeysManager initialKeys={[]} canManage={true} />)
    fireEvent.click(screen.getByRole('button', { name: /nueva api key/i }))
    expect(screen.getByText(/consultar la lista de contactos/i)).toBeInTheDocument()
    expect(screen.getByText(/crear y actualizar contactos/i)).toBeInTheDocument()
    expect(screen.getByText(/acceder a la información básica/i)).toBeInTheDocument()
  })

  it('crear key envía expires_in_days al endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ key: 'cvk_full_key', api_key: { ...KEY_ACTIVE, id: 'key-new' } }),
    })

    render(<ApiKeysManager initialKeys={[]} canManage={true} />)
    fireEvent.click(screen.getByRole('button', { name: /nueva api key/i }))

    fireEvent.change(screen.getByPlaceholderText(/integración crm/i), { target: { value: 'Mi Key' } })
    fireEvent.click(screen.getByText(/crear key/i))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/keys', expect.objectContaining({ method: 'POST' }))
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.expires_in_days).toBe(90) // default
    })
  })

  it('muestra "Último uso" cuando last_used_at está presente', () => {
    render(<ApiKeysManager initialKeys={[KEY_ACTIVE]} canManage={true} />)
    expect(screen.getByText(/último uso/i)).toBeInTheDocument()
  })
})
