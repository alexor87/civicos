'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mail, MessageSquare, Brain, ChevronDown, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Circle, Trash2 } from 'lucide-react'

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

// ── AI Provider models ──────────────────────────────────────────────────────

const AI_PROVIDERS = [
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'openai',    label: 'OpenAI (GPT)' },
  { value: 'google',    label: 'Google AI (Gemini)' },
  { value: 'mistral',   label: 'Mistral AI' },
  { value: 'groq',      label: 'Groq' },
] as const

const PROVIDER_MODELS: Record<string, { value: string; label: string }[]> = {
  anthropic: [
    { value: 'claude-sonnet-4-5-20250514', label: 'Claude Sonnet 4.5' },
    { value: 'claude-haiku-4-5-20251001',  label: 'Claude Haiku 4.5' },
  ],
  openai: [
    { value: 'gpt-4o',      label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  ],
  google: [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-1.5-pro',   label: 'Gemini 1.5 Pro' },
  ],
  mistral: [
    { value: 'mistral-large-latest',  label: 'Mistral Large' },
    { value: 'mistral-medium-latest', label: 'Mistral Medium' },
  ],
  groq: [
    { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
    { value: 'mixtral-8x7b-32768',      label: 'Mixtral 8x7B' },
  ],
}

const API_KEY_PLACEHOLDERS: Record<string, string> = {
  anthropic: 'sk-ant-...',
  openai:    'sk-...',
  google:    'AIza...',
  mistral:   'sk-...',
  groq:      'gsk_...',
}

// ── AI Config Card ──────────────────────────────────────────────────────────

interface AiConfig {
  id?: string
  provider: string
  model: string
  api_key_hint: string
  is_valid: boolean
  configured: boolean
}

function AiConfigCard() {
  const [aiOpen, setAiOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [config, setConfig] = useState<AiConfig | null>(null)
  const [provider, setProvider] = useState('')
  const [model, setModel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/ai-config')
      const data = await res.json()
      setConfig(data)
      if (data.configured) {
        setProvider(data.provider)
        setModel(data.model)
      }
    } catch {
      // ignore
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadConfig() }, [loadConfig])

  const aiStatus: IntegrationStatus = config?.configured
    ? (config.is_valid ? 'connected' : 'unverified')
    : 'unconfigured'

  const models = PROVIDER_MODELS[provider] ?? []

  const handleProviderChange = (val: string) => {
    setProvider(val)
    setModel(PROVIDER_MODELS[val]?.[0]?.value ?? '')
    setApiKey('')
  }

  const handleSave = async () => {
    if (!provider || !model || !apiKey) {
      toast.error('Completa todos los campos')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/settings/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model, apiKey }),
      })
      const data = await res.json()
      if (data.success) {
        if (data.is_valid) {
          toast.success('Modelo de IA configurado y verificado')
        } else {
          toast.error(`API key guardada pero la verificación falló: ${data.error}`)
        }
        setApiKey('')
        await loadConfig()
      } else {
        toast.error(data.error ?? 'Error al guardar')
      }
    } catch {
      toast.error('Error de conexión')
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!config?.id) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/settings/ai-config?id=${config.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Configuración de IA eliminada')
        setConfig(null)
        setProvider('')
        setModel('')
        setApiKey('')
        await loadConfig()
      } else {
        toast.error('Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    }
    setDeleting(false)
  }

  return (
    <Card className="border border-slate-200 rounded-xl overflow-hidden">
      <CardHeader
        className="cursor-pointer hover:bg-slate-50/50 transition-colors py-4 px-5"
        onClick={() => setAiOpen(!aiOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-slate-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Modelo de IA</p>
              {config?.configured && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {AI_PROVIDERS.find(p => p.value === config.provider)?.label ?? config.provider} — {config.model}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            ) : (
              <StatusBadge status={aiStatus} />
            )}
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${aiOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </CardHeader>
      {aiOpen && (
        <CardContent className="border-t border-slate-100 pt-4 space-y-4">
          {config?.configured && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              <span>API Key: <code className="font-mono">{config.api_key_hint}</code></span>
              {config.is_valid && <CheckCircle className="h-3 w-3 text-emerald-500" />}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Proveedor</Label>
            <Select value={provider} onValueChange={handleProviderChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un proveedor" />
              </SelectTrigger>
              <SelectContent>
                {AI_PROVIDERS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {provider && (
            <div className="space-y-1.5">
              <Label>Modelo</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un modelo" />
                </SelectTrigger>
                <SelectContent>
                  {models.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {provider && (
            <div className="space-y-1.5">
              <Label>API Key</Label>
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder={API_KEY_PLACEHOLDERS[provider] ?? 'Tu API key'}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  aria-label={showKey ? 'Ocultar key' : 'Mostrar key'}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Tu key se encripta antes de guardarla. Solo se usa para llamar al proveedor configurado.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving || !provider || !model || !apiKey}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {saving ? 'Verificando…' : 'Verificar y guardar'}
            </Button>
            {config?.configured && (
              <Button size="sm" variant="outline" onClick={handleDelete} disabled={deleting} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Eliminar
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

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

  // ── Save handlers ──────────────────────────────────────────────────────
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

  // ── Test handlers ──────────────────────────────────────────────────────
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
        Configura las integraciones de tu campaña
      </p>

      {/* ── AI Model Card ─────────────────────────────────────────────────── */}
      <AiConfigCard />

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
    </div>
  )
}
