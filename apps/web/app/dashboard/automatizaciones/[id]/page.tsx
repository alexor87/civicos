import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FlowDetail } from '@/components/dashboard/flows/FlowDetail'
import type { AutomationFlow, FlowExecution } from '@/components/dashboard/flows/flowTypes'

type Params = Promise<{ id: string }>

export default async function FlowDetailPage({ params }: { params: Params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_id')
    .eq('id', user.id)
    .single()

  const { data: flow, error } = await supabase
    .from('automation_flows')
    .select('*')
    .eq('id', id)
    .eq('campaign_id', profile?.campaign_id ?? '')
    .single()

  if (error || !flow) notFound()

  // Últimas 20 ejecuciones con nombre del contacto
  const { data: executions } = await supabase
    .from('flow_executions')
    .select('*, contacts(full_name)')
    .eq('flow_id', id)
    .order('started_at', { ascending: false })
    .limit(20)

  const execs: FlowExecution[] = (executions ?? []).map(e => ({
    ...e,
    contact_name: (e.contacts as { full_name?: string } | null)?.full_name ?? 'Contacto desconocido',
    contacts: undefined,
  }))

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard/automatizaciones"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a automatizaciones
      </Link>

      <FlowDetail flow={{ ...(flow as AutomationFlow), executions: execs }} />
    </div>
  )
}
