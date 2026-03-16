import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { SmsCampaignForm } from '@/components/dashboard/SmsCampaignForm'
import { createSmsCampaign } from '../../sms-actions'

export default async function NewSmsCampaignPage() {
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
    <div className="min-h-screen bg-[#f6f7f8]">
      <div className="max-w-2xl mx-auto p-6 lg:p-8 space-y-6">
        <div>
          <Link href="/dashboard/comunicaciones?tab=sms">
            <Button variant="ghost" size="sm" className="-ml-2 text-[#6a737d] hover:text-[#1b1f23]">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Comunicaciones
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold text-[#1b1f23] mt-3">Nueva campaña SMS</h1>
          <p className="text-sm text-[#6a737d] mt-1">
            Redacta el mensaje y elige el segmento de destinatarios.
          </p>
        </div>

        <SmsCampaignForm segments={segments ?? []} action={createSmsCampaign} />
      </div>
    </div>
  )
}
