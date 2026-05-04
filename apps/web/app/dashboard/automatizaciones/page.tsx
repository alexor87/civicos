import Link from 'next/link'
import { Plus, Zap } from 'lucide-react'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getActiveCampaignContext } from '@/lib/auth/active-campaign-context'
import { FlowsList } from '@/components/dashboard/flows/FlowsList'
import type { AutomationFlow } from '@/components/dashboard/flows/flowTypes'

export const metadata = { title: 'Automatizaciones · Scrutix' }

export default async function AutomatizacionesPage() {
  const supabase      = await createClient()
  const adminSupabase = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { activeCampaignId } = await getActiveCampaignContext(supabase, user.id)

  let flows: AutomationFlow[] = []

  const campaignId = activeCampaignId
  if (campaignId) {
    const { data } = await adminSupabase
      .from('automation_flows')
      .select('*')
      .eq('campaign_id', campaignId)
      .neq('status', 'archived')
      .order('created_at', { ascending: false })

    flows = (data ?? []) as AutomationFlow[]
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Automatizaciones</h1>
            <p className="text-sm text-slate-500">Conecta con tus contactos en el momento justo, de forma automática</p>
          </div>
        </div>

        <Link
          href="/dashboard/automatizaciones/new"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Crear nuevo Flow
        </Link>
      </div>

      <FlowsList initialFlows={flows} />
    </div>
  )
}
