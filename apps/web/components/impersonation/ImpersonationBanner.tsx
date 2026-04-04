'use client'

import { useEffect, useState, useCallback } from 'react'
import { ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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

export function ImpersonationBanner() {
  const [data, setData] = useState<ImpersonationData | null>(null)
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const raw = sessionStorage.getItem('impersonation')
    if (!raw) return

    try {
      const parsed = JSON.parse(raw) as ImpersonationData
      if (new Date(parsed.expires_at).getTime() <= Date.now()) {
        handleExit('timeout')
        return
      }
      setData(parsed)
    } catch {
      // Invalid data — ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleExit = useCallback(async (endedBy: 'manual' | 'timeout' = 'manual') => {
    const raw = sessionStorage.getItem('impersonation')
    let returnTo: string | null = null

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ImpersonationData
        returnTo = parsed.returnTo ?? null

        // Sign out first
        const supabase = createClient()
        await supabase.auth.signOut()

        // Notify the server to clean up
        await fetch('/api/auth/end-impersonation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            admin_email: parsed.admin_email,
            tenant_id: parsed.tenant_id,
            tenant_name: parsed.tenant_name,
            session_id: parsed.session_id,
            started_at: parsed.started_at,
            ended_by: endedBy,
          }),
        }).catch(() => {})
      } catch {
        // Best effort
      }
    }

    sessionStorage.removeItem('impersonation')

    if (returnTo) {
      window.location.href = returnTo
    } else {
      window.close()
    }
  }, [])

  // Countdown timer
  useEffect(() => {
    if (!data) return

    const tick = () => {
      const diff = new Date(data.expires_at).getTime() - Date.now()
      if (diff <= 0) {
        handleExit('timeout')
        return
      }
      const mins = Math.floor(diff / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`)
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [data, handleExit])

  if (!data) return null

  return (
    <div className="sticky top-0 z-50 flex items-center gap-3 bg-amber-600 px-4 py-2 text-white text-xs font-medium">
      <ShieldAlert className="w-4 h-4 shrink-0" />

      <span className="flex-1">
        Modo soporte &middot; {data.tenant_name} &middot; {data.admin_email}
      </span>

      {timeLeft && (
        <span className="bg-black/20 px-2 py-0.5 rounded-full text-[11px] font-mono">
          {timeLeft}
        </span>
      )}

      <button
        onClick={() => handleExit('manual')}
        className="bg-black/20 border-none text-white px-3 py-1 rounded-md text-[11px] font-medium cursor-pointer hover:bg-black/30 transition-colors"
      >
        Salir
      </button>
    </div>
  )
}
