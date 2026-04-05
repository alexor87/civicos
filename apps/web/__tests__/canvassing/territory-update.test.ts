import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const { mockGetUser, mockUpdate, mockEq } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockUpdate:  vi.fn(),
  mockEq:      vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === 'territories') {
        return {
          update: (payload: Record<string, unknown>) => {
            mockUpdate(payload)
            return { eq: mockEq }
          },
        }
      }
      return {}
    }),
  })),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
  notFound: vi.fn(() => { throw new Error('NOT_FOUND') }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

function makeFormData(data: Record<string, string>) {
  const fd = new FormData()
  Object.entries(data).forEach(([k, v]) => fd.append(k, v))
  return fd
}

beforeEach(() => {
  vi.clearAllMocks()
  mockEq.mockResolvedValue({ data: null, error: null })
})

describe('updateTerritory', () => {
  it('redirects to /login when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { updateTerritory } = await import(
      '@/app/dashboard/canvassing/territories/actions'
    )
    await expect(
      updateTerritory('t1', makeFormData({ name: 'Norte' }))
    ).rejects.toThrow('REDIRECT:/login')
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('updates territory metadata (name, color, status)', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    const { updateTerritory } = await import(
      '@/app/dashboard/canvassing/territories/actions'
    )

    await expect(
      updateTerritory('terr1', makeFormData({
        name: 'Nuevo nombre',
        description: 'Descripción actualizada',
        color: '#FF0000',
        status: 'en_progreso',
        priority: 'alta',
        estimated_contacts: '150',
        deadline: '2026-12-31',
        geojson: '',
      }))
    ).rejects.toThrow('REDIRECT:/dashboard/canvassing/territories/terr1')

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Nuevo nombre',
      description: 'Descripción actualizada',
      color: '#FF0000',
      status: 'en_progreso',
      priority: 'alta',
      estimated_contacts: 150,
      deadline: '2026-12-31',
      geojson: null,
    }))
    expect(mockEq).toHaveBeenCalledWith('id', 'terr1')
  })

  it('updates geojson polygon when provided', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    const { updateTerritory } = await import(
      '@/app/dashboard/canvassing/territories/actions'
    )

    const geojson = JSON.stringify({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[4.6, -74.1], [4.7, -74.1], [4.7, -74.0], [4.6, -74.0], [4.6, -74.1]]],
        },
        properties: {},
      }],
    })

    await expect(
      updateTerritory('terr2', makeFormData({ name: 'Zona Sur', geojson }))
    ).rejects.toThrow('REDIRECT:/dashboard/canvassing/territories/terr2')

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      geojson: expect.objectContaining({ type: 'FeatureCollection' }),
    }))
  })

  it('allows editing regardless of status (en_progreso, completado)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    const { updateTerritory } = await import(
      '@/app/dashboard/canvassing/territories/actions'
    )

    for (const status of ['en_progreso', 'completado', 'archivado']) {
      mockUpdate.mockClear()
      mockEq.mockClear()
      await expect(
        updateTerritory('terr3', makeFormData({ name: 'Z', status }))
      ).rejects.toThrow('REDIRECT:/dashboard/canvassing/territories/terr3')
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status }))
      expect(mockEq).toHaveBeenCalledWith('id', 'terr3')
    }
  })

  it('handles malformed geojson gracefully (saves null)', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    const { updateTerritory } = await import(
      '@/app/dashboard/canvassing/territories/actions'
    )

    await expect(
      updateTerritory('terr4', makeFormData({ name: 'X', geojson: '{not json' }))
    ).rejects.toThrow('REDIRECT:/dashboard/canvassing/territories/terr4')

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ geojson: null }))
  })

  it('skips update when name is empty', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    const { updateTerritory } = await import(
      '@/app/dashboard/canvassing/territories/actions'
    )

    const result = await updateTerritory('terr5', makeFormData({ name: '' }))
    expect(result).toBeUndefined()
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
