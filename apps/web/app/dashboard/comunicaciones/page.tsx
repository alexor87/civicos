import { createClient } from '@/lib/supabase/server'
import { getIntegrationConfig } from '@/lib/get-integration-config'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Mail, MessageSquare, Send, FileText, AlertCircle, TrendingUp, Inbox, LayoutTemplate } from 'lucide-react'
import { SmartCommsPanel } from '@/components/dashboard/comunicaciones/SmartCommsPanel'
import { ServiceSetupModal } from '@/components/dashboard/comunicaciones/ServiceSetupModal'
// WhatsApp icon via MessageSquare with green tint handled via className

const STATUS_CONFIG: Record<string, { label: string; className: string; Icon: React.ElementType }> = {
  draft:  { label: 'Borrador', className: 'bg-muted text-[#6a737d] border-[#dcdee6]',        Icon: FileText },
  sent:   { label: 'Enviada',  className: 'bg-[#28a745]/10 text-[#28a745] border-[#28a745]/20', Icon: Send },
  failed: { label: 'Fallida',  className: 'bg-red-50 text-red-600 border-red-200',               Icon: AlertCircle },
}

type SearchParams = Promise<{ tab?: string; type?: string }>

export default async function ComunicacionesPage({ searchParams }: { searchParams: SearchParams }) {
  const { tab = 'email', type = 'campaigns' } = await searchParams
  const isEmailTab     = tab === 'email' || (tab !== 'sms' && tab !== 'whatsapp')
  const isSmsTab       = tab === 'sms'
  const isWhatsAppTab  = tab === 'whatsapp'
  const isTemplateView = isEmailTab && type === 'templates'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0] ?? ''
  const tenantId   = profile?.tenant_id

  // Fetch integration config from tenant_integrations
  const integrationConfig = tenantId
    ? await getIntegrationConfig(supabase, tenantId, campaignId || null)
    : null

  const emailConfigured    = !!(integrationConfig?.resend_api_key && integrationConfig?.resend_domain)

  const smsProvider        = integrationConfig?.sms_provider ?? 'twilio'
  const whatsappProvider   = integrationConfig?.whatsapp_provider ?? 'twilio'

  const smsConfigured = smsProvider === 'infobip'
    ? !!(integrationConfig?.infobip_api_key && integrationConfig?.infobip_base_url && integrationConfig?.infobip_sms_from)
    : !!(integrationConfig?.twilio_sid && integrationConfig?.twilio_token && integrationConfig?.twilio_from)

  const whatsappConfigured = whatsappProvider === 'infobip'
    ? !!(integrationConfig?.infobip_api_key && integrationConfig?.infobip_base_url && integrationConfig?.infobip_whatsapp_from)
    : !!(integrationConfig?.twilio_sid && integrationConfig?.twilio_token && integrationConfig?.twilio_whatsapp_from)

  const [{ data: allEmailCampaigns }, { data: smsCampaigns }, { data: whatsappCampaigns }] = await Promise.all([
    supabase.from('email_campaigns').select('*').eq('campaign_id', campaignId).order('created_at', { ascending: false }),
    supabase.from('sms_campaigns').select('*').eq('campaign_id', campaignId).order('created_at', { ascending: false }),
    supabase.from('whatsapp_campaigns').select('*').eq('campaign_id', campaignId).order('created_at', { ascending: false }),
  ])

  // Split email items into templates vs campaigns
  const emailTemplates  = (allEmailCampaigns ?? []).filter((c: { is_template?: boolean }) => c.is_template)
  const emailCampaigns  = (allEmailCampaigns ?? []).filter((c: { is_template?: boolean }) => !c.is_template)

  // Active list for current view
  const campaigns = isEmailTab
    ? (isTemplateView ? emailTemplates : emailCampaigns)
    : isSmsTab
    ? (smsCampaigns ?? [])
    : (whatsappCampaigns ?? [])

  const total     = campaigns.length
  const sent      = campaigns.filter((c: { status: string }) => c.status === 'sent').length
  const drafts    = campaigns.filter((c: { status: string }) => c.status === 'draft').length
  const totalSent = campaigns.reduce((s: number, c: { recipient_count?: number }) => s + (c.recipient_count ?? 0), 0)
  const statLabel = isEmailTab ? (isTemplateView ? 'Plantillas' : 'Emails enviados') : isSmsTab ? 'SMS enviados' : 'WA enviados'
  const newHref   = isEmailTab
    ? (isTemplateView ? '/dashboard/comunicaciones/new?type=template' : '/dashboard/comunicaciones/new')
    : isSmsTab
    ? '/dashboard/comunicaciones/sms/new'
    : '/dashboard/comunicaciones/whatsapp/new'

  return (
    <div className="min-h-screen bg-background">
      {/* Service setup modal for unconfigured channels */}
      {isEmailTab && !emailConfigured && <ServiceSetupModal channel="email" isConfigured={false} />}
      {isSmsTab && !smsConfigured && <ServiceSetupModal channel="sms" isConfigured={false} />}
      {isWhatsAppTab && !whatsappConfigured && <ServiceSetupModal channel="whatsapp" isConfigured={false} />}

      <div className="p-4 md:p-6 lg:p-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#1b1f23]">Comunicaciones</h1>
            <p className="text-sm text-[#6a737d] mt-1">
              {isEmailTab ? 'Campañas de email a segmentos de contactos' : isSmsTab ? 'Campañas de SMS a segmentos de contactos' : 'Campañas de WhatsApp a segmentos de contactos'}
            </p>
          </div>
          <Link href={newHref}>
            <Button className="gap-1.5 shrink-0">
              <Plus className="h-4 w-4" />
              {isTemplateView ? 'Nueva plantilla' : 'Nueva campaña'}
            </Button>
          </Link>
        </div>

        {/* Main channel tabs */}
        <div className="flex gap-1 bg-white border border-[#dcdee6] rounded-md p-1 w-fit">
          <Link
            href="/dashboard/comunicaciones?tab=email"
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              isEmailTab
                ? 'bg-[#2960ec] text-white'
                : 'text-[#6a737d] hover:text-[#1b1f23]'
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            Email
            <span className={`ml-1 text-xs tabular-nums ${isEmailTab ? 'text-blue-200' : 'text-[#6a737d]'}`}>
              {(allEmailCampaigns ?? []).length}
            </span>
          </Link>
          <Link
            href="/dashboard/comunicaciones?tab=sms"
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              isSmsTab
                ? 'bg-[#2960ec] text-white'
                : 'text-[#6a737d] hover:text-[#1b1f23]'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            SMS
            <span className={`ml-1 text-xs tabular-nums ${isSmsTab ? 'text-blue-200' : 'text-[#6a737d]'}`}>
              {smsCampaigns?.length ?? 0}
            </span>
          </Link>
          <Link
            href="/dashboard/comunicaciones?tab=whatsapp"
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              isWhatsAppTab
                ? 'bg-[#25D366] text-white'
                : 'text-[#6a737d] hover:text-[#1b1f23]'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            WhatsApp
            <span className={`ml-1 text-xs tabular-nums ${isWhatsAppTab ? 'text-green-100' : 'text-[#6a737d]'}`}>
              {whatsappCampaigns?.length ?? 0}
            </span>
          </Link>
        </div>

        {/* Email sub-tabs: Campañas / Plantillas */}
        {isEmailTab && (
          <div className="flex gap-1 border-b border-[#dcdee6]">
            <Link
              href="/dashboard/comunicaciones?tab=email&type=campaigns"
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                !isTemplateView
                  ? 'border-[#2960ec] text-[#2960ec]'
                  : 'border-transparent text-[#6a737d] hover:text-[#1b1f23]'
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              Campañas
              <span className="ml-1 text-xs tabular-nums text-[#6a737d]">{emailCampaigns.length}</span>
            </Link>
            <Link
              href="/dashboard/comunicaciones?tab=email&type=templates"
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                isTemplateView
                  ? 'border-[#2960ec] text-[#2960ec]'
                  : 'border-transparent text-[#6a737d] hover:text-[#1b1f23]'
              }`}
            >
              <LayoutTemplate className="h-3.5 w-3.5" />
              Mis plantillas
              <span className="ml-1 text-xs tabular-nums text-[#6a737d]">{emailTemplates.length}</span>
            </Link>
          </div>
        )}

        {/* Stat strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-[#dcdee6] rounded-md overflow-hidden divide-x divide-[#dcdee6]">
          {[
            { label: isTemplateView ? 'Total plantillas' : 'Total campañas', value: total,     Icon: isTemplateView ? LayoutTemplate : (isEmailTab ? Mail : MessageSquare), iconBg: 'bg-[#2960ec]/10',  iconColor: 'text-[#2960ec]',  valueColor: 'text-[#1b1f23]'  },
            { label: 'Enviadas',       value: sent,      Icon: Send,                              iconBg: 'bg-[#28a745]/10',  iconColor: 'text-[#28a745]',  valueColor: isTemplateView ? 'text-[#6a737d]' : 'text-[#28a745]'  },
            { label: 'Borradores',     value: drafts,    Icon: FileText,                          iconBg: 'bg-muted',    iconColor: 'text-[#6a737d]',  valueColor: 'text-[#1b1f23]'  },
            { label: statLabel,        value: totalSent, Icon: TrendingUp,                        iconBg: 'bg-[#6f42c1]/10', iconColor: 'text-[#6f42c1]',  valueColor: isTemplateView ? 'text-[#6a737d]' : 'text-[#6f42c1]'  },
          ].map(k => (
            <div key={k.label} className="flex items-center gap-3 px-5 py-4">
              <div className={`h-9 w-9 rounded-lg ${k.iconBg} flex items-center justify-center shrink-0`}>
                <k.Icon className={`h-4 w-4 ${k.iconColor}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold tabular-nums leading-none ${k.valueColor}`}>
                  {k.value.toLocaleString('es-ES')}
                </p>
                <p className="text-xs text-[#6a737d] mt-1">{k.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* AI Smart Comms panel */}
        <SmartCommsPanel />

        {/* Campaign list */}
        {!campaigns.length ? (
          <div className="bg-white border border-[#dcdee6] rounded-md">
            <div className="flex flex-col items-center gap-3 py-20 text-center px-6">
              <div className="h-14 w-14 rounded-full bg-muted border border-[#dcdee6] flex items-center justify-center">
                <Inbox className="h-6 w-6 text-[#dcdee6]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1b1f23]">
                  {isTemplateView ? 'Sin plantillas aún' : 'Sin campañas aún'}
                </p>
                <p className="text-xs text-[#6a737d] mt-1 max-w-[260px]">
                  {isTemplateView
                    ? 'Crea plantillas de email reutilizables para tus journeys de automatización'
                    : isEmailTab
                    ? 'Crea tu primera campaña de email para comunicarte con tus contactos'
                    : 'Crea tu primera campaña de SMS para comunicarte con tus contactos'}
                </p>
              </div>
              <Link href={newHref}>
                <Button size="sm" className="mt-2 gap-1.5">
                  <Plus className="h-4 w-4" />
                  {isTemplateView ? 'Nueva plantilla' : 'Nueva campaña'}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#dcdee6] rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#dcdee6]">
              <h2 className="text-sm font-semibold text-[#1b1f23]">
                {isTemplateView ? 'Tus plantillas' : 'Tus campañas'}
              </h2>
              <span className="text-xs text-[#6a737d]">
                {isTemplateView ? `${total} plantilla${total !== 1 ? 's' : ''}` : `${total} campaña${total !== 1 ? 's' : ''}`}
              </span>
            </div>
            <div className="divide-y divide-[#dcdee6]">
              {campaigns.map((campaign) => {
                const s    = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.draft
                const isDraft = campaign.status === 'draft'
                const href = isEmailTab
                  ? `/dashboard/comunicaciones/${campaign.id}`
                  : isSmsTab
                  ? `/dashboard/comunicaciones/sms/${campaign.id}`
                  : `/dashboard/comunicaciones/whatsapp/${campaign.id}`
                const Icon = isTemplateView ? LayoutTemplate : (isEmailTab ? Mail : MessageSquare)

                return (
                  <Link
                    key={campaign.id}
                    href={href}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted transition-colors group"
                  >
                    <div className="h-9 w-9 rounded-lg bg-[#2960ec]/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-[#2960ec]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1b1f23] truncate group-hover:text-[#2960ec] transition-colors">
                        {campaign.name}
                      </p>
                      {'subject' in campaign && campaign.subject && (
                        <p className="text-xs text-[#6a737d] truncate mt-0.5">{campaign.subject}</p>
                      )}
                      {'body_text' in campaign && campaign.body_text && (
                        <p className="text-xs text-[#6a737d] truncate mt-0.5">{campaign.body_text}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {campaign.status === 'sent' && (
                        <div className="hidden sm:block text-right">
                          <p className="text-xs text-[#6a737d]">Enviados</p>
                          <p className="text-sm font-semibold text-[#1b1f23] tabular-nums">
                            {campaign.recipient_count.toLocaleString('es-ES')}
                          </p>
                        </div>
                      )}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${s.className}`}>
                        <s.Icon className="h-3 w-3" />
                        {s.label}
                      </span>
                      <p className="text-xs text-[#6a737d] hidden md:block tabular-nums">
                        {new Date(campaign.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
