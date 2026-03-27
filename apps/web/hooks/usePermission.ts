'use client'

import { useContext } from 'react'
import { PermissionsContext } from '@/components/providers/PermissionsProvider'

export function usePermission(permission: string): boolean {
  const { permissions } = useContext(PermissionsContext)
  return permissions[permission] ?? false
}

export function usePermissions(keys: string[]): Record<string, boolean> {
  const { permissions } = useContext(PermissionsContext)
  const result: Record<string, boolean> = {}
  for (const key of keys) {
    result[key] = permissions[key] ?? false
  }
  return result
}

export function usePermissionsLoading(): boolean {
  const { loading } = useContext(PermissionsContext)
  return loading
}

export function usePermissionsRefresh(): () => void {
  const { refresh } = useContext(PermissionsContext)
  return refresh
}
