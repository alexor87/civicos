'use client'

import { usePermissions } from '@/hooks/usePermission'

interface Props {
  permission: string | string[]
  mode?: 'any' | 'all'
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGate({ permission, mode = 'all', fallback = null, children }: Props) {
  const keys = Array.isArray(permission) ? permission : [permission]
  const results = usePermissions(keys)
  const granted = mode === 'any'
    ? keys.some(p => results[p])
    : keys.every(p => results[p])
  return granted ? <>{children}</> : <>{fallback}</>
}
