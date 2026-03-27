import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { PermissionsProvider } from '@/components/providers/PermissionsProvider'
import { usePermission, usePermissions } from '@/hooks/usePermission'
import { PermissionGate } from '@/components/auth/PermissionGate'

// Mock supabase client
const mockEq = vi.fn()
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))

function SinglePermTest({ permission }: { permission: string }) {
  const has = usePermission(permission)
  return <div data-testid="result">{has ? 'YES' : 'NO'}</div>
}

function MultiPermTest({ permissions }: { permissions: string[] }) {
  const results = usePermissions(permissions)
  return (
    <div>
      {permissions.map(p => (
        <span key={p} data-testid={p}>{results[p] ? 'YES' : 'NO'}</span>
      ))}
    </div>
  )
}

function setupMock(perms: { permission: string; is_active: boolean }[]) {
  // For system role lookup: from('custom_roles').select('id').eq('tenant_id',...).eq('base_role_key',...).eq('is_system',...)
  const singleResult = { data: { id: 'sys-role-1' }, error: null }
  const permsResult = { data: perms, error: null }

  mockFrom.mockImplementation((table: string) => {
    if (table === 'custom_roles') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                single: () => Promise.resolve(singleResult),
              }),
            }),
          }),
        }),
      }
    }
    if (table === 'role_permissions') {
      return {
        select: () => ({
          eq: () => Promise.resolve(permsResult),
        }),
      }
    }
    return { select: mockSelect }
  })
}

describe('usePermission', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('super_admin returns true for any permission', async () => {
    render(
      <PermissionsProvider userRole="super_admin" customRoleId={null} tenantId="t1">
        <SinglePermTest permission="contacts.delete" />
      </PermissionsProvider>
    )
    await waitFor(() => expect(screen.getByTestId('result')).toHaveTextContent('YES'))
  })

  it('returns true for active permission', async () => {
    setupMock([
      { permission: 'contacts.view', is_active: true },
      { permission: 'contacts.create', is_active: true },
    ])
    render(
      <PermissionsProvider userRole="volunteer" customRoleId={null} tenantId="t1">
        <SinglePermTest permission="contacts.view" />
      </PermissionsProvider>
    )
    await waitFor(() => expect(screen.getByTestId('result')).toHaveTextContent('YES'))
  })

  it('returns false for inactive permission', async () => {
    setupMock([
      { permission: 'contacts.view', is_active: true },
      { permission: 'contacts.delete', is_active: false },
    ])
    render(
      <PermissionsProvider userRole="volunteer" customRoleId={null} tenantId="t1">
        <SinglePermTest permission="contacts.delete" />
      </PermissionsProvider>
    )
    await waitFor(() => expect(screen.getByTestId('result')).toHaveTextContent('NO'))
  })

  it('returns false for non-existent permission', async () => {
    setupMock([{ permission: 'contacts.view', is_active: true }])
    render(
      <PermissionsProvider userRole="volunteer" customRoleId={null} tenantId="t1">
        <SinglePermTest permission="reports.view" />
      </PermissionsProvider>
    )
    await waitFor(() => expect(screen.getByTestId('result')).toHaveTextContent('NO'))
  })

  it('uses customRoleId when provided', async () => {
    const permsResult = {
      data: [{ permission: 'contacts.view', is_active: true }],
      error: null,
    }
    mockFrom.mockImplementation((table: string) => {
      if (table === 'role_permissions') {
        return {
          select: () => ({
            eq: () => Promise.resolve(permsResult),
          }),
        }
      }
      return { select: mockSelect }
    })

    render(
      <PermissionsProvider userRole="field_coordinator" customRoleId="custom-123" tenantId="t1">
        <SinglePermTest permission="contacts.view" />
      </PermissionsProvider>
    )
    await waitFor(() => expect(screen.getByTestId('result')).toHaveTextContent('YES'))
  })
})

describe('usePermissions', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns multiple permissions correctly', async () => {
    setupMock([
      { permission: 'contacts.view', is_active: true },
      { permission: 'contacts.edit', is_active: false },
      { permission: 'reports.view', is_active: true },
    ])
    render(
      <PermissionsProvider userRole="analyst" customRoleId={null} tenantId="t1">
        <MultiPermTest permissions={['contacts.view', 'contacts.edit', 'reports.view']} />
      </PermissionsProvider>
    )
    await waitFor(() => {
      expect(screen.getByTestId('contacts.view')).toHaveTextContent('YES')
      expect(screen.getByTestId('contacts.edit')).toHaveTextContent('NO')
      expect(screen.getByTestId('reports.view')).toHaveTextContent('YES')
    })
  })
})

describe('PermissionGate', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders children when permission granted', async () => {
    render(
      <PermissionsProvider userRole="super_admin" customRoleId={null} tenantId="t1">
        <PermissionGate permission="contacts.delete">
          <div data-testid="secret">Secret content</div>
        </PermissionGate>
      </PermissionsProvider>
    )
    await waitFor(() => expect(screen.getByTestId('secret')).toBeInTheDocument())
  })

  it('renders fallback when permission denied', async () => {
    setupMock([{ permission: 'contacts.view', is_active: true }])
    render(
      <PermissionsProvider userRole="volunteer" customRoleId={null} tenantId="t1">
        <PermissionGate
          permission="contacts.delete"
          fallback={<div data-testid="denied">Access denied</div>}
        >
          <div data-testid="secret">Secret content</div>
        </PermissionGate>
      </PermissionsProvider>
    )
    await waitFor(() => {
      expect(screen.queryByTestId('secret')).not.toBeInTheDocument()
      expect(screen.getByTestId('denied')).toBeInTheDocument()
    })
  })

  it('renders null when no fallback and denied', async () => {
    setupMock([])
    render(
      <PermissionsProvider userRole="volunteer" customRoleId={null} tenantId="t1">
        <PermissionGate permission="reports.view">
          <div data-testid="secret">Secret</div>
        </PermissionGate>
        <div data-testid="always">Always visible</div>
      </PermissionsProvider>
    )
    await waitFor(() => {
      expect(screen.queryByTestId('secret')).not.toBeInTheDocument()
      expect(screen.getByTestId('always')).toBeInTheDocument()
    })
  })

  it('handles mode=any with multiple permissions', async () => {
    setupMock([
      { permission: 'contacts.view', is_active: true },
      { permission: 'contacts.delete', is_active: false },
    ])
    render(
      <PermissionsProvider userRole="volunteer" customRoleId={null} tenantId="t1">
        <PermissionGate permission={['contacts.view', 'contacts.delete']} mode="any">
          <div data-testid="visible">Visible</div>
        </PermissionGate>
      </PermissionsProvider>
    )
    await waitFor(() => expect(screen.getByTestId('visible')).toBeInTheDocument())
  })

  it('handles mode=all with multiple permissions', async () => {
    setupMock([
      { permission: 'contacts.view', is_active: true },
      { permission: 'contacts.delete', is_active: false },
    ])
    render(
      <PermissionsProvider userRole="volunteer" customRoleId={null} tenantId="t1">
        <PermissionGate permission={['contacts.view', 'contacts.delete']} mode="all">
          <div data-testid="hidden">Hidden</div>
        </PermissionGate>
      </PermissionsProvider>
    )
    await waitFor(() => expect(screen.queryByTestId('hidden')).not.toBeInTheDocument())
  })
})
