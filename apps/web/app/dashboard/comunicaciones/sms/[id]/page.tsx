import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ChevronLeft, MessageSquare, Send, Trash2, FileText, AlertCircle, Users, Pencil } from 'lucide-react'
import Link from 'next/link'
import { deleteSmsCampaign } from '../../sms-actions'
import { SendSmsButton } from '@/components/dashboard/SendSmsButton'
import { TestSmsButton } from '@/components/dashboard/TestSmsButton'

const STATUS_CONFIG: Record<string, { label: string; className: string; Icon: React.ElementType }> = {
  draft:  { label: 'Borrador', className: 'bg-muted text-[#6a737d] border-[#dcdee6]',        Icon: FileText },
  sent:   { label: 'Enviada',  className: 'bg-[#28a745]/10 text-[#28a745] border-[#28a745]/20', Icon: Send },
  failed: { label: 'Fallida',  className: 'bg-red-50 text-red-600 border-red-200',               Icon: AlertCircle },
}

export default async function SmsCampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
    .from('sms_campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (!campaign) {
    return (
      <div className="p-6">
        <p className="text-sm text-[#6a737d]">Campaña SMS no encontrada.</p>
      </div>
    )
  }

  const s = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.draft
  const canSend = ['super_admin', 'campaign_manager'].includes(profile?.role ?? '')
  const isDraft = campaign.status === 'draft'

  let segmentName: string | null = null
  if (campaign.segment_id) {
    const { data: seg } = await supabase
      .from('contact_segments')
      .select('name')
      .eq('id', campaign.segment_id)
      .single()
    segmentName = seg?.name ?? null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6 lg:p-8 space-y-6">

        {/* Header */}
        <div>
          <Link href="/dashboard/comunicaciones?tab=sms">
            <Button variant="ghost" size="sm" className="-ml-2 text-[#6a737d] hover:text-[#1b1f23]">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Comunicaciones
            </Button>
          </Link>

          <div className="mt-3 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-semibold text-[#1b1f23]">{campaign.name}</h1>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.className}`}>
                  <s.Icon className="h-3 w-3" />
                  {s.label}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {isDraft && (
                <Link href={`/dashboard/comunicaciones/sms/${id}/edit`}>
                  <Button variant="outline" size="sm" className="text-[#6a737d] gap-1.5">
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                </Link>
              )}
              {canSend && isDraft && <TestSmsButton campaignId={id} />}
              {canSend && isDraft && (
                <SendSmsButton campaignId={id} recipientCount={campaign.recipient_count} />
              )}
            </div>
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-3 bg-white border border-[#dcdee6] rounded-md overflow-hidden divide-x divide-[#dcdee6]">
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="h-8 w-8 rounded-lg bg-[#2960ec]/10 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 text-[#2960ec]" />
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums text-[#1b1f23]">
                {campaign.recipient_count.toLocaleString('es-ES')}
              </p>
              <p className="text-xs text-[#6a737d] mt-0.5">Destinatarios</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-[#6a737d]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1b1f23] truncate max-w-[140px]">
                {segmentName ?? 'Todos los contactos'}
              </p>
              <p className="text-xs text-[#6a737d] mt-0.5">Segmento</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <MessageSquare className="h-4 w-4 text-[#6a737d]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1b1f23]">
                {campaign.sent_at
                  ? new Date(campaign.sent_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'}
              </p>
              <p className="text-xs text-[#6a737d] mt-0.5">Enviado el</p>
            </div>
          </div>
        </div>

        {/* SMS body preview */}
        <div>
          <p className="text-xs font-semibold text-[#6a737d] uppercase tracking-wide mb-3">Mensaje</p>
          <div className="bg-white border border-[#dcdee6] rounded-md p-4">
            {/* SMS bubble mockup */}
            <div className="flex justify-end">
              <div className="max-w-[280px] bg-[#2960ec] text-white text-sm px-4 py-3 rounded-2xl rounded-br-sm leading-relaxed">
                {campaign.body_text}
              </div>
            </div>
            <p className="text-xs text-[#6a737d] mt-2 text-right">
              {campaign.body_text.length} caracteres ·{' '}
              {campaign.body_text.length <= 160 ? '1 SMS' : campaign.body_text.length <= 306 ? '2 SMS' : 'fragmentado'}
            </p>
          </div>
        </div>

        {/* Delete draft */}
        {isDraft && (
          <div className="flex justify-end pt-2">
            <form action={deleteSmsCampaign.bind(null, campaign.id)}>
              <Button
                type="submit"
                variant="ghost"
                className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-1.5 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar borrador
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
