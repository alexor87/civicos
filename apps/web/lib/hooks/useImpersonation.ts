'use client'

import { useState, useEffect } from 'react'

interface ImpersonationData {
  admin_id: string
  admin_email: string
  tenant_id: string
  tenant_name: string
  session_id: string
  started_at: string
  expires_at: string
  returnTo?: string | null
}

interface UseImpersonationReturn {
  isImpersonating: boolean
  adminEmail: string | null
  expiresAt: string | null
  tenantId: string | null
  tenantName: string | null
  sessionId: string | null
}

export function useImpersonation(): UseImpersonationReturn {
  const [data, setData] = useState<ImpersonationData | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = sessionStorage.getItem('impersonation')
    if (!raw) return

    try {
      const parsed = JSON.parse(raw) as ImpersonationData
      if (new Date(parsed.expires_at).getTime() <= Date.now()) {
        sessionStorage.removeItem('impersonation')
        return
      }
      setData(parsed)
    } catch {
      // Invalid data — ignore
    }
  }, [])

  if (!data) {
    return { isImpersonating: false, adminEmail: null, expiresAt: null, tenantId: null, tenantName: null, sessionId: null }
  }

  return {
    isImpersonating: true,
    adminEmail: data.admin_email,
    expiresAt: data.expires_at,
    tenantId: data.tenant_id,
    tenantName: data.tenant_name,
    sessionId: data.session_id,
  }
}
