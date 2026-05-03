import { createClient } from '@/lib/supabase/server'
import { getActiveCampaignContext } from '@/lib/auth/active-campaign-context'
import { AISuggestionsPanel } from '@/components/dashboard/AISuggestionsPanel'
import { AIStatusChart } from '@/components/dashboard/AIStatusChart'
import { CampaignBriefPanel } from '@/components/dashboard/ai/CampaignBriefPanel'
import { resolveThresholds } from '@/lib/agents/thresholds'
import { Brain } from 'lucide-react'

export default async function AIPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { activeCampaignId, role } = await getActiveCampaignContext(supabase, user.id)
  const campaignId = activeCampaignId

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('name, config')
    .eq('id', campaignId ?? '')
    .single()

  const campaignName = campaign?.name ?? ''
  const thresholds = resolveThresholds(campaign?.config)

  const { data: suggestions } = await supabase
    .from('ai_suggestions')
    .select('*')
    .eq('campaign_id', campaignId ?? '')
    .in('status', ['active', 'pending_approval'])
    .order('created_at', { ascending: false })

  const { data: history } = await supabase
    .from('ai_suggestions')
    .select('*')
    .eq('campaign_id', campaignId ?? '')
    .in('status', ['applied', 'dismissed', 'rejected'])
    .order('updated_at', { ascending: false })
    .limit(20)

  const { data: agentRuns } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('campaign_id', campaignId ?? '')
    .order('created_at', { ascending: false })
    .limit(10)

  const [{ count: appliedCount }, { count: dismissedCount }] = await Promise.all([
    supabase.from('ai_suggestions')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId ?? '')
      .eq('status', 'applied'),
    supabase.from('ai_suggestions')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId ?? '')
      .in('status', ['dismissed', 'rejected']),
  ])

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1b1f23] flex items-center gap-2">
          <Brain className="h-5 w-5 text-[#2960ec]" />
          Centro de Inteligencia IA
        </h1>
        <p className="text-sm text-[#6a737d] mt-1">
          Sugerencias generadas por agentes IA basadas en los datos en tiempo real de tu campaña
        </p>
      </div>

      <AIStatusChart
        active={suggestions?.length ?? 0}
        applied={appliedCount ?? 0}
        dismissed={dismissedCount ?? 0}
      />

      <CampaignBriefPanel />

      <AISuggestionsPanel
        suggestions={suggestions ?? []}
        history={history ?? []}
        agentRuns={agentRuns ?? []}
        campaignId={campaignId ?? ''}
        userRole={role ?? 'analyst'}
        campaignName={campaignName}
        thresholds={thresholds}
      />
      </div>
    </div>
  )
}
