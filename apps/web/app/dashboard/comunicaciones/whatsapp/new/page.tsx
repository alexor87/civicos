import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { WhatsAppCampaignForm } from '@/components/dashboard/WhatsAppCampaignForm'
import { createWhatsAppCampaign } from '../../whatsapp-actions'
import { WHATSAPP_CHANNEL_ENABLED } from '@/lib/features/messaging-channels'

export default async function NewWhatsAppCampaignPage() {
  if (!WHATSAPP_CHANNEL_ENABLED) redirect('/dashboard/comunicaciones?tab=email')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0] ?? ''

  const { data: segments } = await supabase
    .from('contact_segments')
    .select('id, name')
    .eq('campaign_id', campaignId)
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div>
          <Link href="/dashboard/comunicaciones?tab=whatsapp">
            <Button variant="ghost" size="sm" className="-ml-2 text-[#6a737d] hover:text-[#1b1f23]">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Comunicaciones
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold text-[#1b1f23] mt-3">Nueva campaña WhatsApp</h1>
          <p className="text-sm text-[#6a737d] mt-1">
            Selecciona un template aprobado por Meta y el segmento de destinatarios.
          </p>
        </div>

        <WhatsAppCampaignForm campaignId={campaignId} segments={segments ?? []} action={createWhatsAppCampaign} />
      </div>
    </div>
  )
}
