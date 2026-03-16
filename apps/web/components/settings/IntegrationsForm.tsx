'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, MessageSquare, Brain } from 'lucide-react'

interface Campaign {
  id:              string
  resend_domain?:  string | null
  twilio_sid?:     string | null
  twilio_token?:   string | null
  twilio_from?:    string | null
}

interface Props {
  campaign: Campaign | null
}

export function IntegrationsForm({ campaign }: Props) {
  const [resendDomain,  setResendDomain]  = useState(campaign?.resend_domain  ?? '')
  const [twilioSid,     setTwilioSid]     = useState(campaign?.twilio_sid     ?? '')
  const [twilioToken,   setTwilioToken]   = useState(campaign?.twilio_token   ?? '')
  const [twilioFrom,    setTwilioFrom]    = useState(campaign?.twilio_from    ?? '')
  const [saving,       setSaving]       = useState(false)

  if (!campaign) {
    return <p className="text-sm text-[#6a737d]">No hay campaña activa.</p>
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const res = await fetch('/api/settings/integrations', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        campaign_id:   campaign.id,
        resend_domain: resendDomain  || null,
        twilio_sid:    twilioSid     || null,
        twilio_token:  twilioToken   || null,
        twilio_from:   twilioFrom    || null,
      }),
    })

    setSaving(false)
    if (res.ok) {
      toast.success('Integraciones guardadas')
    } else {
      toast.error('Error al guardar las integraciones')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">

      {/* Email */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-[#6a737d]" />
          <h3 className="text-sm font-semibold text-[#1b1f23]">Email — Resend</h3>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="resend_domain">Dominio verificado en Resend</Label>
          <Input
            id="resend_domain"
            value={resendDomain}
            onChange={e => setResendDomain(e.target.value)}
            placeholder="Ej: campaña.com"
          />
          <p className="text-xs text-muted-foreground">
            El dominio desde el que se envían los emails de la campaña.
          </p>
        </div>
      </section>

      {/* SMS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#6a737d]" />
          <h3 className="text-sm font-semibold text-[#1b1f23]">SMS — Twilio</h3>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="twilio_sid">Account SID</Label>
            <Input
              id="twilio_sid"
              value={twilioSid}
              onChange={e => setTwilioSid(e.target.value)}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="twilio_token">Auth Token</Label>
            <Input
              id="twilio_token"
              type="password"
              value={twilioToken}
              onChange={e => setTwilioToken(e.target.value)}
              placeholder="Tu Auth Token de Twilio"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="twilio_from">Número de origen</Label>
            <Input
              id="twilio_from"
              value={twilioFrom}
              onChange={e => setTwilioFrom(e.target.value)}
              placeholder="+15551234567"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Encuentra estas credenciales en{' '}
            <a href="https://console.twilio.com" target="_blank" rel="noreferrer" className="text-[#2960ec] hover:underline">
              console.twilio.com
            </a>{' '}
            → Account Info.
          </p>
        </div>
      </section>

      {/* LLM */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-[#6a737d]" />
          <h3 className="text-sm font-semibold text-[#1b1f23]">Modelo de IA — Claude</h3>
        </div>
        <div className="rounded-md bg-[#f6f7f8] border border-[#dcdee6] px-4 py-3 text-sm text-[#6a737d]">
          Modelo activo: <span className="font-medium text-[#1b1f23]">claude-sonnet-4-6</span>
          <br />
          <span className="text-xs">La configuración avanzada del modelo estará disponible en Plan Campaign.</span>
        </div>
      </section>

      <Button type="submit" disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar integraciones'}
      </Button>
    </form>
  )
}
