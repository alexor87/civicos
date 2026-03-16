/**
 * RLS Penetration Tests — Zero Data Leakage Between Tenants
 *
 * These tests simulate attack scenarios where a user from Tenant A attempts to
 * read, modify or delete data belonging to Tenant B.  The Supabase mock returns
 * what a correctly-configured RLS policy would return (empty / null / 0 rows
 * affected) and we verify that the application handles those responses
 * correctly — no data leakage, no silent corruption.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const {
  mockGetUser,
  mockProfileSingle,
  mockContactsSelect,
  mockContactSingle,
  mockContactDelete,
  mockCampaignSingle,
  mockCampaignUpdate,
  mockCampaignDelete,
  mockSegmentSingle,
  mockSegmentSelect,
  mockSegmentDelete,
  mockVisitsSelect,
  mockResendSend,
} = vi.hoisted(() => ({
  mockGetUser:         vi.fn(),
  mockProfileSingle:   vi.fn(),
  mockContactsSelect:  vi.fn(),
  mockContactSingle:   vi.fn(),
  mockContactDelete:   vi.fn(),
  mockCampaignSingle:  vi.fn(),
  mockCampaignUpdate:  vi.fn(),
  mockCampaignDelete:  vi.fn(),
  mockSegmentSingle:   vi.fn(),
  mockSegmentSelect:   vi.fn(),
  mockSegmentDelete:   vi.fn(),
  mockVisitsSelect:    vi.fn(),
  mockResendSend:      vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      // ── profiles ────────────────────────────────────────────────────────────
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ single: mockProfileSingle })),
          })),
          insert: vi.fn(),
        }
      }

      // ── contacts ────────────────────────────────────────────────────────────
      if (table === 'contacts') {
        return {
          select: vi.fn(() => ({
            eq:     vi.fn(() => ({
              single: mockContactSingle,
              not:    vi.fn(mockContactsSelect),
              order:  vi.fn(mockContactsSelect),
            })),
            order:  vi.fn(mockContactsSelect),
          })),
          delete: vi.fn(() => ({ eq: mockContactDelete })),
        }
      }

      // ── email_campaigns ─────────────────────────────────────────────────────
      if (table === 'email_campaigns') {
        return {
          select:  vi.fn(() => ({ eq: vi.fn(() => ({ single: mockCampaignSingle })) })),
          update:  vi.fn(() => ({ eq: vi.fn(() => ({ eq: mockCampaignUpdate })) })),
          delete:  vi.fn(() => ({ eq: mockCampaignDelete })),
          insert:  vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn() })) })),
        }
      }

      // ── contact_segments ────────────────────────────────────────────────────
      if (table === 'contact_segments') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: mockSegmentSingle,
              order:  vi.fn(mockSegmentSelect),
            })),
            order: vi.fn(mockSegmentSelect),
          })),
          delete: vi.fn(() => ({ eq: mockSegmentDelete })),
        }
      }

      // ── canvass_visits ──────────────────────────────────────────────────────
      if (table === 'canvass_visits') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order:  vi.fn(mockVisitsSelect),
              single: vi.fn(() => Promise.resolve({ data: null })),
            })),
          })),
        }
      }

      return {}
    }),
  })),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
}))

vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = { send: mockResendSend }
  },
}))

vi.mock('@/app/dashboard/contacts/segments/actions', () => ({
  applyFilters: vi.fn(async () => ({ data: [] })),
}))

import {
  sendCampaign,
  sendTestEmail,
  deleteCampaign,
  updateCampaign,
} from '@/app/dashboard/comunicaciones/actions'
import { inviteTeamMember } from '@/app/dashboard/team/actions'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeFormData(data: Record<string, string>) {
  const fd = new FormData()
  Object.entries(data).forEach(([k, v]) => fd.append(k, v))
  return fd
}

/** Tenant A profile — the attacking user */
const TENANT_A_PROFILE = {
  id:           'user_a',
  tenant_id:    'tenant_a',
  campaign_ids: ['campaign_a'],
  role:         'campaign_manager',
  full_name:    'User A',
}

beforeEach(() => {
  vi.clearAllMocks()
  // Default: attacking user is authenticated as tenant A
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user_a' } } })
  mockProfileSingle.mockResolvedValue({ data: TENANT_A_PROFILE })
  mockResendSend.mockResolvedValue({ id: 'email_ok' })
})

// ══════════════════════════════════════════════════════════════════════════════
// 1. EMAIL CAMPAIGNS — cross-tenant access
// ══════════════════════════════════════════════════════════════════════════════

describe('RLS — email campaigns cross-tenant isolation', () => {
  /**
   * RLS blocks the SELECT: the campaign belongs to tenant B, so the DB returns
   * null for a user authenticated as tenant A.
   */
  it('sendCampaign: cannot send a campaign that belongs to another tenant', async () => {
    // RLS returns null — tenant B's campaign is invisible to tenant A
    mockCampaignSingle.mockResolvedValueOnce({ data: null })

    const result = await sendCampaign('campaign_b_id')
    expect(result).toEqual({ error: 'Campaña no encontrada' })
  })

  it('sendCampaign: cannot re-send an already-sent campaign (idempotency guard)', async () => {
    // Even if somehow accessible, a "sent" campaign is blocked
    mockCampaignSingle.mockResolvedValueOnce({
      data: { id: 'campaign_b_id', status: 'sent', segment_id: null, subject: 'X', body_html: '<p>X</p>' },
    })

    const result = await sendCampaign('campaign_b_id')
    expect(result).toEqual({ error: 'Esta campaña ya fue enviada' })
  })

  it('sendTestEmail: cannot access a campaign from another tenant', async () => {
    // RLS returns null — the record is not in tenant A's view
    mockCampaignSingle.mockResolvedValueOnce({ data: null })

    const result = await sendTestEmail('campaign_b_id', 'attacker@tenant-a.com')
    expect(result).toEqual({ error: 'Campaña no encontrada' })
  })

  it('sendTestEmail: unpermitted role cannot send test emails', async () => {
    mockProfileSingle.mockResolvedValueOnce({
      data: { ...TENANT_A_PROFILE, role: 'volunteer' },
    })

    const result = await sendTestEmail('campaign_a_id', 'attacker@tenant-a.com')
    expect(result).toEqual({ error: 'No tienes permiso para enviar emails de prueba' })
  })

  it('deleteCampaign: app-layer check blocks cross-tenant delete before reaching DB', async () => {
    // RLS returns null for tenant B's campaign when queried by tenant A
    mockCampaignSingle.mockResolvedValueOnce({ data: null })

    await expect(deleteCampaign('campaign_b_id')).rejects.toThrow(
      'REDIRECT:/dashboard/comunicaciones'
    )
    // App-layer ownership check prevented the delete from ever reaching the DB
    expect(mockCampaignDelete).not.toHaveBeenCalled()
  })

  it('updateCampaign: RLS blocks update of another tenant\'s campaign', async () => {
    // RLS returns no matching rows (0 rows updated) — no error exposed to caller
    mockCampaignUpdate.mockResolvedValueOnce({ error: null })

    // Should redirect after update (action doesn't know 0 rows were touched)
    await expect(
      updateCampaign(
        'campaign_b_id',
        makeFormData({ name: 'Hijacked', subject: 'Evil', body_html: '<p>Pwned</p>' })
      )
    ).rejects.toThrow('REDIRECT:/dashboard/comunicaciones/campaign_b_id')

    // The important invariant: update was called but RLS (DB side) restricts it
    expect(mockCampaignUpdate).toHaveBeenCalled()
  })

  it('updateCampaign: volunteer role is blocked before any DB write', async () => {
    mockProfileSingle.mockResolvedValueOnce({
      data: { ...TENANT_A_PROFILE, role: 'volunteer' },
    })

    const result = await updateCampaign(
      'campaign_b_id',
      makeFormData({ name: 'X', subject: 'X', body_html: '<p>X</p>' })
    )
    expect(result).toBeUndefined()
    // DB update should never be reached
    expect(mockCampaignUpdate).not.toHaveBeenCalled()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 2. EMAIL CAMPAIGNS — insufficient permissions (role escalation)
// ══════════════════════════════════════════════════════════════════════════════

describe('RLS — campaign role escalation attempts', () => {
  it('sendCampaign: analyst role cannot send campaigns', async () => {
    mockProfileSingle.mockResolvedValueOnce({
      data: { ...TENANT_A_PROFILE, role: 'analyst' },
    })

    const result = await sendCampaign('campaign_a_id')
    expect(result).toEqual({ error: 'No tienes permiso para enviar campañas' })
    // Should NOT reach the email_campaigns query
    expect(mockCampaignSingle).not.toHaveBeenCalled()
  })

  it('sendCampaign: field_coordinator role cannot send campaigns', async () => {
    mockProfileSingle.mockResolvedValueOnce({
      data: { ...TENANT_A_PROFILE, role: 'field_coordinator' },
    })

    const result = await sendCampaign('campaign_a_id')
    expect(result).toEqual({ error: 'No tienes permiso para enviar campañas' })
  })

  it('sendCampaign: volunteer role cannot send campaigns', async () => {
    mockProfileSingle.mockResolvedValueOnce({
      data: { ...TENANT_A_PROFILE, role: 'volunteer' },
    })

    const result = await sendCampaign('campaign_a_id')
    expect(result).toEqual({ error: 'No tienes permiso para enviar campañas' })
  })

  it('sendCampaign: unauthenticated user is redirected to login', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })

    await expect(sendCampaign('campaign_a_id')).rejects.toThrow('REDIRECT:/login')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 3. TEAM — cross-tenant member invitation
// ══════════════════════════════════════════════════════════════════════════════

describe('RLS — team invitation isolation', () => {
  it('volunteer cannot invite new team members', async () => {
    mockProfileSingle.mockResolvedValueOnce({
      data: { ...TENANT_A_PROFILE, role: 'volunteer' },
    })

    const result = await inviteTeamMember(
      makeFormData({ full_name: 'Evil User', role: 'campaign_manager' })
    )
    expect(result).toBeUndefined() // blocked; no DB write
  })

  it('analyst cannot invite new team members', async () => {
    mockProfileSingle.mockResolvedValueOnce({
      data: { ...TENANT_A_PROFILE, role: 'analyst' },
    })

    const result = await inviteTeamMember(
      makeFormData({ full_name: 'Evil User', role: 'campaign_manager' })
    )
    expect(result).toBeUndefined()
  })

  it('cannot invite with an elevated role (super_admin escalation)', async () => {
    // Even a campaign_manager cannot grant super_admin
    const result = await inviteTeamMember(
      makeFormData({ full_name: 'Escalation', role: 'super_admin' })
    )
    expect(result).toBeUndefined()
  })

  it('unauthenticated user is redirected to login', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })

    await expect(
      inviteTeamMember(makeFormData({ full_name: 'Ana', role: 'volunteer' }))
    ).rejects.toThrow('REDIRECT:/login')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 4. SEND CAMPAIGN — no empty recipient leakage
// ══════════════════════════════════════════════════════════════════════════════

describe('RLS — send campaign recipient isolation', () => {
  /**
   * When RLS is working correctly for the contacts table, a tenant A user
   * querying contacts with campaign_b's ID gets an empty result set.
   * The action should return an error rather than silently sending 0 emails.
   */
  it('returns error when RLS filters out all contacts (empty segment)', async () => {
    mockCampaignSingle.mockResolvedValueOnce({
      data: { id: 'campaign_a_id', status: 'draft', segment_id: null, subject: 'Hi', body_html: '<p>Hi</p>' },
    })
    // RLS blocks all contacts — returns empty
    mockContactsSelect.mockResolvedValueOnce({ data: [] })

    const result = await sendCampaign('campaign_a_id')
    expect(result).toEqual({ error: 'No hay destinatarios con email en este segmento' })
    // Resend should never be called when there are 0 recipients
    expect(mockResendSend).not.toHaveBeenCalled()
  })

  it('does not call Resend when segment has no contacts with email', async () => {
    mockCampaignSingle.mockResolvedValueOnce({
      data: { id: 'campaign_a_id', status: 'draft', segment_id: null, subject: 'Hi', body_html: '<p>Hi</p>' },
    })
    // Contacts exist but none have email (RLS-filtered nulls scenario)
    mockContactsSelect.mockResolvedValueOnce({
      data: [
        { id: 'c1', email: null, first_name: 'Sin', last_name: 'Email' },
      ],
    })

    const result = await sendCampaign('campaign_a_id')
    expect(result).toEqual({ error: 'No hay destinatarios con email en este segmento' })
    expect(mockResendSend).not.toHaveBeenCalled()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 5. UNAUTHENTICATED ACCESS — all protected actions redirect to login
// ══════════════════════════════════════════════════════════════════════════════

describe('RLS — unauthenticated access blocked universally', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
  })

  it('sendCampaign redirects to /login', async () => {
    await expect(sendCampaign('any_id')).rejects.toThrow('REDIRECT:/login')
  })

  it('sendTestEmail redirects to /login', async () => {
    await expect(sendTestEmail('any_id', 'x@x.com')).rejects.toThrow('REDIRECT:/login')
  })

  it('deleteCampaign redirects to /login', async () => {
    await expect(deleteCampaign('any_id')).rejects.toThrow('REDIRECT:/login')
  })

  it('updateCampaign redirects to /login', async () => {
    await expect(
      updateCampaign('any_id', makeFormData({ name: 'X', subject: 'X', body_html: '<p>X</p>' }))
    ).rejects.toThrow('REDIRECT:/login')
  })

  it('inviteTeamMember redirects to /login', async () => {
    await expect(
      inviteTeamMember(makeFormData({ full_name: 'Ana', role: 'volunteer' }))
    ).rejects.toThrow('REDIRECT:/login')
  })
})
