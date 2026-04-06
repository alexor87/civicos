'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardKPIs } from '@/components/dashboard/DashboardKPIs'

interface WeeklyDataPoint {
  week: string
  contacts: number
}

interface KPIData {
  totalContacts: number
  supporters: number
  pendingVisits: number
  totalVisits: number
  supportRate: number
  coverageRate: number
  weeklyData: WeeklyDataPoint[]
}

interface Props {
  campaignId: string
  initialKPIs: KPIData
}

export function RealtimeKPIs({ campaignId, initialKPIs }: Props) {
  const [kpis, setKpis] = useState<KPIData>(initialKPIs)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refreshKPIs = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/kpis?campaignId=${campaignId}`)
      if (!res.ok) return
      const data = await res.json()
      // weeklyData is not returned by the KPIs endpoint (it requires a separate query);
      // preserve the server-rendered value via spread
      setKpis(prev => ({ ...prev, ...data }))
    } catch {
      // Network error — keep showing last known data
    }
  }, [campaignId])

  // Debounced refresh: collapses rapid-fire changes (e.g. bulk imports) into a single fetch
  const debouncedRefresh = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      refreshKPIs()
    }, 5000)
  }, [refreshKPIs])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`dashboard-kpis-${campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts', filter: `campaign_id=eq.${campaignId}` }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'canvass_visits', filter: `campaign_id=eq.${campaignId}` }, debouncedRefresh)
      .subscribe()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      supabase.removeChannel(channel)
    }
  }, [campaignId, debouncedRefresh])

  return (
    <DashboardKPIs
      totalContacts={kpis.totalContacts}
      supporters={kpis.supporters}
      supportRate={kpis.supportRate}
      totalVisits={kpis.totalVisits}
      coverageRate={kpis.coverageRate}
      pendingVisits={kpis.pendingVisits}
      weeklyData={kpis.weeklyData}
    />
  )
}
