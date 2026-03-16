import { createClient } from '@/lib/supabase/server'
import { AISuggestionsPanel } from '@/components/dashboard/AISuggestionsPanel'
import { AIStatusChart } from '@/components/dashboard/AIStatusChart'
import { CampaignBriefPanel } from '@/components/dashboard/ai/CampaignBriefPanel'
import { resolveThresholds } from '@/lib/agents/thresholds'
import { Brain } from 'lucide-react'

export default async function AIPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0]

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
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-[#1b1f23] flex items-center gap-2">
          <Brain className="h-4 w-4 text-[#2960ec]" />
          Centro de Inteligencia IA
        </h2>
        <p className="text-sm text-[#6a737d] mt-0.5">
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
        userRole={profile?.role ?? 'analyst'}
        campaignName={campaignName}
        thresholds={thresholds}
      />
    </div>
  )
}
