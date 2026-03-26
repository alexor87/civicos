'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Mail, MessageSquare, Brain, ChevronDown, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Circle } from 'lucide-react'

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

type IntegrationStatus = 'connected' | 'unconfigured' | 'unverified'

function getStatus(fields: (string | null | undefined)[]): IntegrationStatus {
  const filled = fields.filter(f => f && f.trim()).length
  if (filled === 0) return 'unconfigured'
  if (filled === fields.length) return 'connected'
  return 'unverified'
}

function StatusBadge({ status }: { status: IntegrationStatus }) {
  if (status === 'connected') {
    return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1"><CheckCircle className="h-3 w-3" />Conectado</Badge>
  }
  if (status === 'unverified') {
    return <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1"><AlertCircle className="h-3 w-3" />Sin verificar</Badge>
  }
  return <Badge className="bg-slate-100 text-slate-500 border-slate-200 gap-1"><Circle className="h-3 w-3" />Sin configurar</Badge>
}

export function IntegrationsForm({ campaign }: Props) {
  // Resend state
  const [resendDomain,  setResendDomain]  = useState(campaign?.resend_domain  ?? '')
  const [savingResend,  setSavingResend]  = useState(false)
  const [testingResend, setTestingResend] = useState(false)
  const [resendOpen,    setResendOpen]    = useState(false)

  // Twilio state
  const [twilioSid,     setTwilioSid]     = useState(campaign?.twilio_sid     ?? '')
  const [twilioToken,   setTwilioToken]   = useState(campaign?.twilio_token   ?? '')
  const [twilioFrom,    setTwilioFrom]    = useState(campaign?.twilio_from    ?? '')
  const [showToken,     setShowToken]     = useState(false)
  const [savingTwilio,  setSavingTwilio]  = useState(false)
  const [testingTwilio, setTestingTwilio] = useState(false)
  const [twilioOpen,    setTwilioOpen]    = useState(false)

  if (!campaign) {
    return <p className="text-sm text-[#6a737d]">No hay campaña activa.</p>
  }

  const resendStatus = getStatus([resendDomain])
  const twilioStatus = getStatus([twilioSid, twilioToken, twilioFrom])
  const configuredCount = [resendStatus, twilioStatus].filter(s => s !== 'unconfigured').length

  // ── Save handlers ──────────────────────────────────────────────────────────
  const saveResend = async () => {
    setSavingResend(true)
    const res = await fetch('/api/settings/integrations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: campaign.id, resend_domain: resendDomain || null }),
    })
    setSavingResend(false)
    if (res.ok) toast.success('Configuración de email guardada')
    else toast.error('Error al guardar configuración de email')
  }

  const saveTwilio = async () => {
    setSavingTwilio(true)
    const res = await fetch('/api/settings/integrations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaign_id: campaign.id,
        twilio_sid:   twilioSid   || null,
        twilio_token: twilioToken || null,
        twilio_from:  twilioFrom  || null,
      }),
    })
    setSavingTwilio(false)
    if (res.ok) toast.success('Configuración de SMS guardada')
    else toast.error('Error al guardar configuración de SMS')
  }

  // ── Test handlers ──────────────────────────────────────────────────────────
  const testResend = async () => {
    setTestingResend(true)
    try {
      const res = await fetch('/api/settings/integrations/test-resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campaign.id }),
      })
      if (res.ok) toast.success('Conexión con Resend verificada')
      else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? 'Error al verificar la conexión con Resend')
      }
    } catch {
      toast.error('Error de conexión')
    }
    setTestingResend(false)
  }

  const testTwilio = async () => {
    setTestingTwilio(true)
    try {
      const res = await fetch('/api/settings/integrations/test-twilio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campaign.id }),
      })
      if (res.ok) toast.success('Conexión con Twilio verificada')
      else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? 'Las credenciales de Twilio son inválidas. Verifica el Auth Token en la consola de Twilio.')
      }
    } catch {
      toast.error('Error de conexión')
    }
    setTestingTwilio(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Summary */}
      <p className="text-sm text-slate-500">
        {configuredCount} de 3 integraciones configuradas
      </p>

      {/* ── Resend Card ─────────────────────────────────────────────────────── */}
      <Card className="border border-slate-200 rounded-xl overflow-hidden">
        <CardHeader
          className="cursor-pointer hover:bg-slate-50/50 transition-colors py-4 px-5"
          onClick={() => setResendOpen(!resendOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Email — Resend</p>
                {resendDomain && <p className="text-xs text-slate-500 mt-0.5">Dominio: {resendDomain}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={resendStatus} />
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${resendOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </CardHeader>
        {resendOpen && (
          <CardContent className="border-t border-slate-100 pt-4 space-y-4">
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
            <div className="flex gap-2">
              <Button size="sm" onClick={saveResend} disabled={savingResend}>
                {savingResend && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {savingResend ? 'Guardando…' : 'Guardar'}
              </Button>
              {resendStatus !== 'unconfigured' && (
                <Button size="sm" variant="outline" onClick={testResend} disabled={testingResend}>
                  {testingResend && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {testingResend ? 'Probando…' : 'Probar conexión'}
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── Twilio Card ─────────────────────────────────────────────────────── */}
      <Card className="border border-slate-200 rounded-xl overflow-hidden">
        <CardHeader
          className="cursor-pointer hover:bg-slate-50/50 transition-colors py-4 px-5"
          onClick={() => setTwilioOpen(!twilioOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">SMS — Twilio</p>
                {twilioFrom && <p className="text-xs text-slate-500 mt-0.5">Origen: {twilioFrom}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={twilioStatus} />
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${twilioOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </CardHeader>
        {twilioOpen && (
          <CardContent className="border-t border-slate-100 pt-4 space-y-4">
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
              <div className="relative">
                <Input
                  id="twilio_token"
                  type={showToken ? 'text' : 'password'}
                  value={twilioToken}
                  onChange={e => setTwilioToken(e.target.value)}
                  placeholder="Tu Auth Token de Twilio"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  aria-label={showToken ? 'Ocultar token' : 'Mostrar token'}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
              <a href="https://console.twilio.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                console.twilio.com
              </a>{' '}
              → Account Info.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveTwilio} disabled={savingTwilio}>
                {savingTwilio && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {savingTwilio ? 'Guardando…' : 'Guardar'}
              </Button>
              {twilioStatus !== 'unconfigured' && (
                <Button size="sm" variant="outline" onClick={testTwilio} disabled={testingTwilio}>
                  {testingTwilio && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {testingTwilio ? 'Probando…' : 'Probar conexión'}
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── Claude Card ─────────────────────────────────────────────────────── */}
      <Card className="border border-slate-200 rounded-xl overflow-hidden">
        <CardHeader className="py-4 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Modelo de IA — Claude</p>
                <p className="text-xs text-slate-500 mt-0.5">claude-sonnet-4-6</p>
              </div>
            </div>
            <StatusBadge status="connected" />
          </div>
        </CardHeader>
        <CardContent className="border-t border-slate-100 pt-3 pb-4">
          <p className="text-xs text-slate-500">
            La configuración avanzada del modelo estará disponible en Plan Campaign.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
