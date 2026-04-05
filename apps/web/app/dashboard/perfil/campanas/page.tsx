'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, Loader2, CheckCircle } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  status?: string
}

export default function CampanasPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState<string | null>(null)

  useEffect(() => {
    // Fetch profile to get campaign_ids, then fetch campaigns
    fetch('/api/profile')
      .then(r => r.json())
      .then(async (profile) => {
        const campaignIds: string[] = profile.campaign_ids ?? []
        if (campaignIds.length === 0) {
          setLoading(false)
          return
        }

        // Get active campaign from cookie (reading it from the page context)
        // We'll determine active from the profile's first campaign or cookie
        setActiveCampaignId(campaignIds[0])

        // Fetch campaign details - we call the profile API which has the IDs
        // In a full implementation, we'd have a campaigns list API
        // For now, map IDs to basic objects
        try {
          const res = await fetch(`/api/campaigns?ids=${campaignIds.join(',')}`)
          if (res.ok) {
            const data = await res.json()
            setCampaigns(data.campaigns ?? data ?? [])
          } else {
            // Fallback: show IDs as names
            setCampaigns(campaignIds.map(id => ({ id, name: `Campaña ${id.slice(0, 8)}` })))
          }
        } catch {
          setCampaigns(campaignIds.map(id => ({ id, name: `Campaña ${id.slice(0, 8)}` })))
        }
        setLoading(false)
      })
      .catch(() => { toast.error('Error al cargar campañas'); setLoading(false) })
  }, [])

  async function handleSwitch(campaignId: string) {
    if (campaignId === activeCampaignId || switching) return
    setSwitching(campaignId)
    try {
      const res = await fetch('/api/campaigns/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      })
      if (res.ok) {
        setActiveCampaignId(campaignId)
        toast.success('Campaña activa cambiada')
      } else {
        toast.error('Error al cambiar campaña')
      }
    } catch {
      toast.error('Error al cambiar campaña')
    } finally {
      setSwitching(null)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Mis campañas</h1>
        <p className="text-sm text-slate-500 mt-1">Campañas a las que tienes acceso</p>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-slate-50 rounded-lg p-4 md:p-8 text-center">
          <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">No tienes campañas asignadas</p>
          <p className="text-xs text-slate-400 mt-1">Contacta a tu administrador para ser agregado a una campaña</p>
        </div>
      ) : (
        <div className="space-y-2">
          {campaigns.map(campaign => {
            const isActive = campaign.id === activeCampaignId
            return (
              <div
                key={campaign.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  isActive ? 'border-primary/30 bg-primary/5' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    isActive ? 'bg-primary/10' : 'bg-slate-100'
                  }`}>
                    {isActive ? (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    ) : (
                      <Building2 className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{campaign.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {isActive && <Badge className="bg-primary/10 text-primary border-0 text-[10px]">Campaña activa</Badge>}
                    </div>
                  </div>
                </div>

                {!isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSwitch(campaign.id)}
                    disabled={switching === campaign.id}
                  >
                    {switching === campaign.id && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                    Activar
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
