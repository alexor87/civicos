import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getActiveCampaignContext } from '@/lib/auth/active-campaign-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { FileText, Plus, ChevronLeft } from 'lucide-react'

export default async function ScriptsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { activeCampaignId } = await getActiveCampaignContext(supabase, user.id)
  const campaignId = activeCampaignId

  const { data: scripts } = await supabase
    .from('canvass_scripts')
    .select('*')
    .eq('campaign_id', campaignId ?? '')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/canvassing">
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 -ml-2">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Territorio
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Scripts de conversación</h1>
            <p className="text-sm text-gray-500 mt-0.5">{scripts?.length ?? 0} scripts configurados</p>
          </div>
        </div>
        <Link href="/dashboard/canvassing/scripts/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo script
          </Button>
        </Link>
      </div>

      {!scripts?.length ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
            <FileText className="h-6 w-6 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700">Sin scripts configurados</p>
          <p className="text-sm text-slate-400">
            Los scripts guían a los voluntarios durante las conversaciones en terreno
          </p>
          <Link href="/dashboard/canvassing/scripts/new">
            <Button size="sm" className="mt-2">
              <Plus className="h-4 w-4 mr-1.5" />
              Crear script
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {scripts.map(script => {
            const questions = Array.isArray(script.questions) ? script.questions : []
            return (
              <div key={script.id} className="border rounded-lg bg-white p-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{script.name}</h3>
                      <Badge variant={script.is_active ? 'default' : 'secondary'} className="text-xs">
                        {script.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    {script.description && (
                      <p className="text-sm text-slate-500 mt-0.5">{script.description}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {questions.length} pregunta{questions.length !== 1 ? 's' : ''} · v{script.version} ·{' '}
                      Creado {new Date(script.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
                <Link href={`/dashboard/canvassing/scripts/new?clone=${script.id}`}>
                  <Button variant="outline" size="sm">Ver preguntas</Button>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
