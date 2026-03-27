'use client'

import { createContext, useCallback, useEffect, useState } from 'react'
import { ALL_PERMISSIONS } from '@/lib/permissions'

export interface PermissionsContextValue {
  permissions: Record<string, boolean>
  loading: boolean
  refresh: () => void
}

export const PermissionsContext = createContext<PermissionsContextValue>({
  permissions: {},
  loading: true,
  refresh: () => {},
})

interface Props {
  userRole: string
  customRoleId: string | null
  tenantId: string
  children: React.ReactNode
}

export function PermissionsProvider({ userRole, customRoleId, tenantId, children }: Props) {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  const fetchPermissions = useCallback(async () => {
    // Super admin has all permissions — shortcut without API call
    if (userRole === 'super_admin') {
      const allTrue: Record<string, boolean> = {}
      ALL_PERMISSIONS.forEach(p => { allTrue[p] = true })
      setPermissions(allTrue)
      setLoading(false)
      return
    }

    try {
      // Fetch via server API to bypass RLS issues (JWT lacks tenant_id claim)
      const res = await fetch('/api/me/permissions')
      if (res.ok) {
        const permMap = await res.json()
        setPermissions(permMap)
      } else {
        console.error('[PermissionsProvider] Failed to fetch permissions:', res.status)
        setPermissions({})
      }
    } catch {
      setPermissions({})
    } finally {
      setLoading(false)
    }
  }, [userRole, customRoleId, tenantId])

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  return (
    <PermissionsContext.Provider value={{ permissions, loading, refresh: fetchPermissions }}>
      {children}
    </PermissionsContext.Provider>
  )
}
