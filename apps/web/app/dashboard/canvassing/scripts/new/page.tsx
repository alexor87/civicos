'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ScriptEditor } from '@/components/dashboard/ScriptEditor'

async function createScript(campaignId: string, tenantId: string, userId: string, formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = (formData.get('name') as string).trim()
  if (!name) return

  const questionsRaw = formData.get('questions') as string
  let questions = []
  try {
    questions = JSON.parse(questionsRaw)
  } catch {
    questions = []
  }

  await supabase.from('canvass_scripts').insert({
    campaign_id: campaignId,
    tenant_id: tenantId,
    name,
    description: (formData.get('description') as string).trim() || null,
    questions,
    is_active: formData.get('is_active') !== 'false',
    created_by: userId,
  })

  redirect('/dashboard/canvassing/scripts')
}

export default async function NewScriptPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids, tenant_id')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0]
  const tenantId = profile?.tenant_id
  if (!campaignId || !tenantId) notFound()

  const boundCreate = createScript.bind(null, campaignId, tenantId, user.id)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/dashboard/canvassing/scripts">
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 -ml-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Scripts
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo script de conversación</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={boundCreate} className="space-y-6">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre del script *</Label>
              <Input id="name" name="name" required placeholder="Ej: Script puerta a puerta — Fase 1" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Descripción</Label>
              <textarea
                id="description"
                name="description"
                rows={2}
                placeholder="Para qué tipo de visita se usa este script…"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                defaultChecked
                value="true"
                className="h-4 w-4 rounded border-input accent-indigo-600"
              />
              <Label htmlFor="is_active" className="cursor-pointer font-normal">
                Script activo (visible para voluntarios)
              </Label>
            </div>

            {/* Question builder (client component) */}
            <ScriptEditor />

            <div className="flex gap-3 pt-2 border-t">
              <Button type="submit" className="flex-1">Guardar script</Button>
              <Link href="/dashboard/canvassing/scripts">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
