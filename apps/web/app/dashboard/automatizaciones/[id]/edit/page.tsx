import { createClient, createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { VisualFlowEditor } from '@/components/dashboard/flows/VisualFlowEditor'
import type { AutomationFlow } from '@/components/dashboard/flows/flowTypes'

type Params = Promise<{ id: string }>

export default async function EditFlowPage({ params }: { params: Params }) {
  const { id } = await params
  const supabase      = await createClient()
  const adminSupabase = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0] ?? ''

  const { data: flow, error } = await adminSupabase
    .from('automation_flows')
    .select('*')
    .eq('id', id)
    .eq('campaign_id', campaignId)
    .single()

  if (error || !flow) notFound()

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <Link
        href={`/dashboard/automatizaciones/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al detalle
      </Link>

      <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Editar flow</h1>

      <VisualFlowEditor initialFlow={flow as AutomationFlow} />
    </div>
  )
}
