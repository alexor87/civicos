import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, MessageSquare, Send, Trash2, FileText, AlertCircle, ArrowDown, ArrowUp } from 'lucide-react'
import Link from 'next/link'
import { deleteWhatsAppCampaign } from '../../whatsapp-actions'
import { SendWhatsAppButton } from '@/components/dashboard/SendWhatsAppButton'
import { WHATSAPP_CHANNEL_ENABLED } from '@/lib/features/messaging-channels'

const STATUS_CONFIG: Record<string, { label: string; className: string; Icon: React.ElementType }> = {
  draft:  { label: 'Borrador', className: 'bg-muted text-[#6a737d] border-[#dcdee6]',        Icon: FileText },
  sent:   { label: 'Enviada',  className: 'bg-[#28a745]/10 text-[#28a745] border-[#28a745]/20', Icon: Send },
  failed: { label: 'Fallida',  className: 'bg-red-50 text-red-600 border-red-200',               Icon: AlertCircle },
}

export default async function WhatsAppCampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!WHATSAPP_CHANNEL_ENABLED) redirect('/dashboard/comunicaciones?tab=email')

  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids, role')
    .eq('id', user.id)
    .single()

  const { data: campaign } = await supabase
    .from('whatsapp_campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (!campaign) {
    return (
      <div className="p-6">
        <p className="text-sm text-[#6a737d]">Campaña de WhatsApp no encontrada.</p>
      </div>
    )
  }

  const s        = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.draft
  const canSend  = ['super_admin', 'campaign_manager'].includes(profile?.role ?? '')
  const isDraft  = campaign.status === 'draft'

  let segmentName: string | null = null
  if (campaign.segment_id) {
    const { data: seg } = await supabase
      .from('contact_segments')
      .select('name')
      .eq('id', campaign.segment_id)
      .single()
    segmentName = seg?.name ?? null
  }

  const manualCount = campaign.recipient_ids?.length ?? 0
  const recipientLabel = manualCount > 0
    ? `Manual · ${manualCount} contacto${manualCount === 1 ? '' : 's'}`
    : segmentName ?? 'Todos los contactos'

  // Conversation history for this campaign
  const { data: conversations } = await supabase
    .from('whatsapp_conversations')
    .select('*')
    .eq('whatsapp_campaign_id', id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Back */}
        <div>
          <Link href="/dashboard/comunicaciones?tab=whatsapp">
            <Button variant="ghost" size="sm" className="-ml-2 text-[#6a737d] hover:text-[#1b1f23]">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Comunicaciones
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#25D366]/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-[#25D366]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#1b1f23]">{campaign.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${s.className}`}>
                  <s.Icon className="h-3 w-3" />
                  {s.label}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canSend && isDraft && (
              <SendWhatsAppButton campaignId={campaign.id} recipientCount={campaign.recipient_count} />
            )}
            {isDraft && (
              <form action={deleteWhatsAppCampaign.bind(null, campaign.id)}>
                <Button type="submit" variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="bg-white border border-[#dcdee6] rounded-md p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#1b1f23]">Detalles</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-[#6a737d]">Template</dt>
              <dd className="font-mono text-[#1b1f23] mt-0.5">{campaign.template_name}</dd>
            </div>
            <div>
              <dt className="text-[#6a737d]">Destinatarios</dt>
              <dd className="text-[#1b1f23] mt-0.5">{recipientLabel}</dd>
            </div>
            <div>
              <dt className="text-[#6a737d]">Destinatarios</dt>
              <dd className="text-[#1b1f23] mt-0.5 font-semibold tabular-nums">
                {campaign.recipient_count.toLocaleString('es-ES')}
              </dd>
            </div>
            {campaign.sent_at && (
              <div>
                <dt className="text-[#6a737d]">Enviada</dt>
                <dd className="text-[#1b1f23] mt-0.5">
                  {new Date(campaign.sent_at).toLocaleString('es-ES')}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Conversation history */}
        {(conversations ?? []).length > 0 && (
          <div className="bg-white border border-[#dcdee6] rounded-md overflow-hidden">
            <div className="px-5 py-4 border-b border-[#dcdee6]">
              <h2 className="text-sm font-semibold text-[#1b1f23]">Conversaciones</h2>
              <p className="text-xs text-[#6a737d] mt-0.5">{conversations!.length} mensajes</p>
            </div>
            <div className="divide-y divide-[#dcdee6] max-h-96 overflow-y-auto">
              {conversations!.map(conv => (
                <div key={conv.id} className="flex items-start gap-3 px-5 py-3">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    conv.direction === 'inbound'
                      ? 'bg-muted border border-[#dcdee6]'
                      : 'bg-[#25D366]/10'
                  }`}>
                    {conv.direction === 'inbound'
                      ? <ArrowDown className="h-3 w-3 text-[#6a737d]" />
                      : <ArrowUp className="h-3 w-3 text-[#25D366]" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1b1f23]">{conv.body}</p>
                    <p className="text-xs text-[#6a737d] mt-0.5">
                      {conv.direction === 'inbound' ? 'Recibido' : 'Enviado'} ·{' '}
                      {new Date(conv.created_at).toLocaleString('es-ES')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
