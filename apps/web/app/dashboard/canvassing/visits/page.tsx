import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { ExportButton } from '@/components/dashboard/ExportButton'
import { VisitsTable } from '@/components/dashboard/canvassing/VisitsTable'

const PAGE_SIZE = 50

export default async function VisitsHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    result?: string
    status?: string
    territory?: string
    page?: string
  }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids, role')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0]
  const canApprove = ['super_admin', 'campaign_manager', 'field_coordinator'].includes(profile?.role ?? '')

  const params      = await searchParams
  const resultFilter    = params.result    ?? ''
  const statusFilter    = params.status    ?? ''
  const territoryFilter = params.territory ?? ''
  const page            = Math.max(1, parseInt(params.page ?? '1', 10))
  const offset          = (page - 1) * PAGE_SIZE

  // ── Build query ───────────────────────────────────────────────────────────
  let query = supabase
    .from('canvass_visits')
    .select(
      '*, contacts(first_name, last_name), profiles!volunteer_id(full_name), territories(name, color)',
      { count: 'exact' }
    )
    .eq('campaign_id', campaignId ?? '')
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (resultFilter)    query = query.eq('result',       resultFilter)
  if (statusFilter)    query = query.eq('status',       statusFilter)
  if (territoryFilter) query = query.eq('territory_id', territoryFilter)

  const [
    { data: visits, count: total },
    { data: territories },
  ] = await Promise.all([
    query,
    supabase
      .from('territories')
      .select('id, name, color')
      .eq('campaign_id', campaignId ?? '')
      .order('name', { ascending: true }),
  ])

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-6 lg:p-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/canvassing">
              <Button variant="ghost" size="sm" className="text-[#6a737d] hover:text-[#1b1f23] -ml-2">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Territorio
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-[#1b1f23]">Historial de visitas</h1>
              <p className="text-sm text-[#6a737d] mt-0.5">{total ?? 0} visitas registradas</p>
            </div>
          </div>
          <ExportButton baseUrl="/api/export/canvassing" />
        </div>

        {/* ── Table ── */}
        <VisitsTable
          visits={(visits ?? []) as Parameters<typeof VisitsTable>[0]['visits']}
          total={total ?? 0}
          page={page}
          pageSize={PAGE_SIZE}
          territories={territories ?? []}
          canApprove={canApprove}
          resultFilter={resultFilter || undefined}
          statusFilter={statusFilter || undefined}
          territoryFilter={territoryFilter || undefined}
        />

      </div>
    </div>
  )
}
