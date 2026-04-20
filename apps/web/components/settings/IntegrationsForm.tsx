'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mail, MessageSquare, Brain, ChevronDown, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Circle, Trash2, Globe, ExternalLink } from 'lucide-react'

interface IntegrationConfig {
  id:                     string
  tenant_id:              string
  campaign_id:            string | null
  resend_api_key:         string | null
  resend_api_key_hint:    string | null
  resend_domain:          string | null
  resend_from_name:       string | null
  resend_from_email:      string | null
  twilio_sid:             string | null
  twilio_token:           string | null
  twilio_token_hint:      string | null
  twilio_from:            string | null
  twilio_whatsapp_from:   string | null
  resend_webhook_secret:  string | null
  resend_webhook_secret_hint: string | null
}

interface Props {
  integrationConfig: IntegrationConfig | null
  campaignId: string | null
  tenantId: string | null
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

export function IntegrationsForm({ integrationConfig, campaignId, tenantId }: Props) {
  const config = integrationConfig

  // Resend state
  const [resendApiKey,    setResendApiKey]    = useState('')
  const [resendDomain,    setResendDomain]    = useState(config?.resend_domain    ?? '')
  const [resendFromName,  setResendFromName]  = useState(config?.resend_from_name  ?? '')
  const [resendFromEmail, setResendFromEmail] = useState(config?.resend_from_email ?? '')
  const [resendWebhookSecret, setResendWebhookSecret] = useState('')
  const [showResendKey,   setShowResendKey]   = useState(false)
  const [showWebhookSecret, setShowWebhookSecret] = useState(false)
  const [savingResend,    setSavingResend]    = useState(false)
  const [testingResend,   setTestingResend]   = useState(false)
  const [resendOpen,      setResendOpen]      = useState(false)
  const [domainError,     setDomainError]     = useState('')

  // Twilio state
  const [twilioSid,     setTwilioSid]     = useState(config?.twilio_sid     ?? '')
  const [twilioToken,   setTwilioToken]   = useState('')
  const [twilioFrom,    setTwilioFrom]    = useState(config?.twilio_from    ?? '')
  const [showToken,     setShowToken]     = useState(false)
  const [savingTwilio,  setSavingTwilio]  = useState(false)
  const [testingTwilio, setTestingTwilio] = useState(false)
  const [twilioOpen,    setTwilioOpen]    = useState(false)

  // WhatsApp state
  const [whatsappFrom,     setWhatsappFrom]     = useState(config?.twilio_whatsapp_from ?? '')
  const [savingWhatsApp,   setSavingWhatsApp]   = useState(false)
  const [whatsappOpen,     setWhatsappOpen]     = useState(false)

  // Resend status: needs both API key and domain
  const resendHasKey    = !!(config?.resend_api_key_hint || resendApiKey)
  const resendHasDomain = !!resendDomain.trim()
  const resendStatus: IntegrationStatus = resendHasKey && resendHasDomain
    ? 'connected'
    : (resendHasKey || resendHasDomain ? 'unverified' : 'unconfigured')

  // Twilio status: needs SID, token, and from number
  const twilioHasToken = !!(config?.twilio_token_hint || twilioToken)
  const twilioStatus: IntegrationStatus = twilioSid.trim() && twilioHasToken && twilioFrom.trim()
    ? 'connected'
    : (twilioSid.trim() || twilioHasToken || twilioFrom.trim() ? 'unverified' : 'unconfigured')

  // WhatsApp status: needs Twilio creds + WhatsApp number
  const whatsappStatus: IntegrationStatus = twilioStatus === 'connected' && whatsappFrom.trim()
    ? 'connected'
    : (whatsappFrom.trim() ? 'unverified' : 'unconfigured')

  // ── Domain / email validation ───────────────────────────────────────────
  const isFullEmail = resendDomain.includes('@')

  const validateDomainOrEmail = (value: string): boolean => {
    if (!value.trim()) { setDomainError(''); return true }
    if (value.includes('@')) {
      // Validate as email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value.trim())) {
        setDomainError('Email inválido. Ej: tu@email.com')
        return false
      }
      setDomainError('')
      return true
    }
    // Support international domain names (IDN) — allow Unicode letters
    const domainRegex = /^[\p{L}\p{N}][\p{L}\p{N}-]*[\p{L}\p{N}]?(\.\p{L}{2,})+$/u
    if (!domainRegex.test(value.trim())) {
      setDomainError('Dominio inválido. Ej: tucampaña.com')
      return false
    }
    setDomainError('')
    return true
  }

  const handleDomainChange = (value: string) => {
    setResendDomain(value)
    if (value.trim()) validateDomainOrEmail(value)
    else setDomainError('')
  }

  // ── Email preview ─────────────────────────────────────────────────────
  const emailPreview = resendDomain.trim()
    ? isFullEmail
      ? resendDomain.trim()
      : `${resendFromEmail.trim() || 'contacto'}@${resendDomain.trim()}`
    : null
  const fromPreview = resendFromName.trim() && emailPreview
    ? `${resendFromName.trim()} <${emailPreview}>`
    : emailPreview

  // ── Save handlers ──────────────────────────────────────────────────────
  const saveResend = async () => {
    if (resendDomain.trim() && !validateDomainOrEmail(resendDomain)) return
    setSavingResend(true)
    const payload: Record<string, unknown> = {
      resend_domain:     resendDomain     || null,
      resend_from_name:  resendFromName   || null,
      resend_from_email: resendFromEmail  || null,
    }
    if (resendApiKey) {
      payload.resend_api_key = resendApiKey
    }
    if (resendWebhookSecret) {
      payload.resend_webhook_secret = resendWebhookSecret
    }
    if (campaignId) payload.campaign_id = campaignId
    const res = await fetch('/api/settings/integrations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSavingResend(false)
    if (res.ok) {
      toast.success('Configuración de email guardada')
      if (resendApiKey) setResendApiKey('')
      if (resendWebhookSecret) setResendWebhookSecret('')
    } else toast.error('Error al guardar configuración de email')
  }

  const saveTwilio = async () => {
    setSavingTwilio(true)
    const payload: Record<string, unknown> = {
      twilio_sid:   twilioSid   || null,
      twilio_from:  twilioFrom  || null,
    }
    if (twilioToken) {
      payload.twilio_token = twilioToken
    }
    if (campaignId) payload.campaign_id = campaignId
    const res = await fetch('/api/settings/integrations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSavingTwilio(false)
    if (res.ok) {
      toast.success('Configuración de SMS guardada')
      if (twilioToken) setTwilioToken('')
    } else toast.error('Error al guardar configuración de SMS')
  }

  const saveWhatsApp = async () => {
    setSavingWhatsApp(true)
    const payload: Record<string, unknown> = {
      twilio_whatsapp_from: whatsappFrom || null,
    }
    if (campaignId) payload.campaign_id = campaignId
    const res = await fetch('/api/settings/integrations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSavingWhatsApp(false)
    if (res.ok) toast.success('Configuración de WhatsApp guardada')
    else toast.error('Error al guardar configuración de WhatsApp')
  }

  // ── Test handlers ──────────────────────────────────────────────────────
  const testResend = async () => {
    setTestingResend(true)
    try {
      const res = await fetch('/api/settings/integrations/test-resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campaignId }),
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
        body: JSON.stringify({}),
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
        Configura las integraciones de tu tenant
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
                {fromPreview && <p className="text-xs text-slate-500 mt-0.5">{fromPreview}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={resendStatus} />
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${resendOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </CardHeader>
        {resendOpen && (
          <CardContent className="border-t border-slate-100 pt-4 space-y-5">
            {/* Step-by-step guide */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 space-y-2">
              <p className="text-xs font-semibold text-blue-900">Configuración en 3 pasos:</p>
              <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                <li>
                  Crea una cuenta en{' '}
                  <a href="https://resend.com/signup" target="_blank" rel="noreferrer" className="font-medium underline inline-flex items-center gap-0.5">
                    resend.com<ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  Agrega y verifica tu dominio en{' '}
                  <a href="https://resend.com/domains" target="_blank" rel="noreferrer" className="font-medium underline inline-flex items-center gap-0.5">
                    Domains<ExternalLink className="h-3 w-3" />
                  </a>
                  {' '}(requiere acceso a DNS)
                </li>
                <li>
                  Copia tu API key desde{' '}
                  <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="font-medium underline inline-flex items-center gap-0.5">
                    API Keys<ExternalLink className="h-3 w-3" />
                  </a>
                  {' '}y pégala abajo
                </li>
              </ol>
            </div>

            {config?.resend_api_key_hint && (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                <span>API Key guardada: <code className="font-mono">{config.resend_api_key_hint}</code></span>
                <CheckCircle className="h-3 w-3 text-emerald-500" />
              </div>
            )}

            {/* API Key */}
            <div className="space-y-1.5">
              <Label htmlFor="resend_api_key">API Key</Label>
              <div className="relative">
                <Input
                  id="resend_api_key"
                  type={showResendKey ? 'text' : 'password'}
                  value={resendApiKey}
                  onChange={e => setResendApiKey(e.target.value)}
                  placeholder={config?.resend_api_key_hint ? 'Dejar vacío para mantener la actual' : 're_...'}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowResendKey(!showResendKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  aria-label={showResendKey ? 'Ocultar key' : 'Mostrar key'}
                >
                  {showResendKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Tu API key se encripta antes de guardarla.
              </p>
            </div>

            {/* Domain or Email */}
            <div className="space-y-1.5">
              <Label htmlFor="resend_domain">Dominio o email verificado</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="resend_domain"
                  value={resendDomain}
                  onChange={e => handleDomainChange(e.target.value)}
                  placeholder="tucampaña.com o tu@email.com"
                  className={`pl-9 ${domainError ? 'border-red-300 focus-visible:ring-red-200' : ''}`}
                />
              </div>
              {domainError ? (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />{domainError}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {isFullEmail
                    ? 'Email verificado en Resend (cuenta gratuita).'
                    : 'El dominio que verificaste en Resend. Ej: tucampaña.com'}
                </p>
              )}
            </div>

            {/* From Name */}
            <div className="space-y-1.5">
              <Label htmlFor="resend_from_name">Nombre del remitente</Label>
              <Input
                id="resend_from_name"
                value={resendFromName}
                onChange={e => setResendFromName(e.target.value)}
                placeholder="Ej: Campaña Juan Esteban"
              />
              <p className="text-xs text-muted-foreground">
                El nombre que verán los destinatarios en su bandeja de entrada.
              </p>
            </div>

            {/* From Email prefix — only shown for custom domains */}
            {!isFullEmail && (
            <div className="space-y-1.5">
              <Label htmlFor="resend_from_email">Email de envío</Label>
              <div className="flex items-center gap-0">
                <Input
                  id="resend_from_email"
                  value={resendFromEmail}
                  onChange={e => setResendFromEmail(e.target.value.replace(/[@\s]/g, ''))}
                  placeholder="contacto"
                  className="rounded-r-none border-r-0"
                />
                <div className="flex items-center px-3 h-9 bg-slate-100 border border-slate-200 rounded-r-md text-sm text-slate-500 whitespace-nowrap">
                  @{resendDomain.trim() || 'tudominio.com'}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                La dirección desde la que se envían los emails. Ej: contacto, info, noreply.
              </p>
            </div>
            )}

            {/* Email preview */}
            {fromPreview && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-slate-500 mb-1">Vista previa del remitente:</p>
                <p className="text-sm text-slate-900 font-mono">{fromPreview}</p>
              </div>
            )}

            {/* Webhook Secret */}
            <div className="border-t border-slate-100 pt-5 space-y-4">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Webhooks (métricas de email)</p>

              {tenantId && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 space-y-1">
                  <p className="text-xs font-medium text-slate-500">URL del webhook para Resend:</p>
                  <code className="text-xs text-slate-900 break-all select-all">
                    {typeof window !== 'undefined' ? window.location.origin : 'https://app.scrutix.co'}/api/webhooks/resend/{tenantId}
                  </code>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pega esta URL en Resend → Webhooks → Add Endpoint. Selecciona los eventos: delivered, opened, clicked, bounced.
                  </p>
                </div>
              )}

              {config?.resend_webhook_secret_hint && (
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                  <span>Webhook Secret guardado: <code className="font-mono">{config.resend_webhook_secret_hint}</code></span>
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="resend_webhook_secret">Signing Secret</Label>
                <div className="relative">
                  <Input
                    id="resend_webhook_secret"
                    type={showWebhookSecret ? 'text' : 'password'}
                    value={resendWebhookSecret}
                    onChange={e => setResendWebhookSecret(e.target.value)}
                    placeholder={config?.resend_webhook_secret_hint ? 'Dejar vacío para mantener el actual' : 'whsec_...'}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    aria-label={showWebhookSecret ? 'Ocultar secret' : 'Mostrar secret'}
                  >
                    {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Se encuentra en Resend → Webhooks → tu endpoint → Signing Secret.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={saveResend} disabled={savingResend || !!domainError}>
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
            {config?.twilio_token_hint && (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                <span>Auth Token: <code className="font-mono">{config.twilio_token_hint}</code></span>
                <CheckCircle className="h-3 w-3 text-emerald-500" />
              </div>
            )}
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
                  placeholder={config?.twilio_token_hint ? 'Dejar vacío para mantener el actual' : 'Tu Auth Token de Twilio'}
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
              <p className="text-xs text-muted-foreground">
                El token se encripta antes de guardarla.
              </p>
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
      {/* ── WhatsApp Card ──────────────────────────────────────────────────── */}
      <Card className="border border-slate-200 rounded-xl overflow-hidden">
        <CardHeader
          className="cursor-pointer hover:bg-slate-50/50 transition-colors py-4 px-5"
          onClick={() => setWhatsappOpen(!whatsappOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-[#25D366]" />
              <div>
                <p className="text-sm font-semibold text-slate-900">WhatsApp — Twilio Business</p>
                {whatsappFrom && <p className="text-xs text-slate-500 mt-0.5">Número: {whatsappFrom}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={whatsappStatus} />
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${whatsappOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </CardHeader>
        {whatsappOpen && (
          <CardContent className="border-t border-slate-100 pt-4 space-y-4">
            {twilioStatus === 'connected' ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                <CheckCircle className="h-3 w-3" />
                Usa las mismas credenciales de Twilio configuradas en SMS
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                <AlertCircle className="h-3 w-3" />
                Primero configura las credenciales de Twilio en la sección de SMS
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="twilio_whatsapp_from">Número de WhatsApp Business</Label>
              <Input
                id="twilio_whatsapp_from"
                value={whatsappFrom}
                onChange={e => setWhatsappFrom(e.target.value)}
                placeholder="+5731xxxxxxx"
              />
              <p className="text-xs text-muted-foreground">
                El número aprobado como WhatsApp Sender en{' '}
                <a href="https://console.twilio.com/us1/develop/sms/senders/whatsapp-senders" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  console.twilio.com
                </a>{' '}
                → WhatsApp Senders.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveWhatsApp} disabled={savingWhatsApp}>
                {savingWhatsApp && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {savingWhatsApp ? 'Guardando…' : 'Guardar'}
              </Button>
              {whatsappStatus !== 'unconfigured' && (
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
