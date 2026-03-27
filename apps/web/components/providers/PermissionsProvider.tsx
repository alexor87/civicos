'use client'

import { createContext, useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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
    // Super admin has all permissions
    if (userRole === 'super_admin') {
      // Use a proxy that returns true for any key
      const allTrue = new Proxy({} as Record<string, boolean>, {
        get: (_target, prop) => {
          if (typeof prop === 'string') return true
          return undefined
        },
        has: () => true,
      })
      setPermissions(allTrue)
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      let roleId = customRoleId

      // If no custom_role_id, look up the system role
      if (!roleId) {
        const { data: sysRole } = await supabase
          .from('custom_roles')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('base_role_key', userRole)
          .eq('is_system', true)
          .single()

        roleId = sysRole?.id ?? null
      }

      if (!roleId) {
        setPermissions({})
        setLoading(false)
        return
      }

      const { data: perms } = await supabase
        .from('role_permissions')
        .select('permission, is_active')
        .eq('role_id', roleId)

      const permMap: Record<string, boolean> = {}
      perms?.forEach((p: { permission: string; is_active: boolean }) => {
        permMap[p.permission] = p.is_active
      })

      setPermissions(permMap)
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
