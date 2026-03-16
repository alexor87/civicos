'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

async function createCampaign(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  const name = (formData.get('name') as string).trim()
  const description = (formData.get('description') as string).trim()
  const electionDate = formData.get('election_date') as string
  const isActive = formData.get('is_active') === 'on'

  if (!name) return

  const { data: campaign } = await supabase
    .from('campaigns')
    .insert({
      tenant_id: profile?.tenant_id,
      name,
      description: description || null,
      election_date: electionDate || null,
      is_active: isActive,
    })
    .select('id')
    .single()

  if (campaign) {
    // Add campaign to user's profile
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('campaign_ids')
      .eq('id', user.id)
      .single()

    const currentIds = (currentProfile?.campaign_ids as string[] | null) ?? []
    await supabase
      .from('profiles')
      .update({ campaign_ids: [...currentIds, campaign.id] })
      .eq('id', user.id)
  }

  redirect('/dashboard/campaigns')
}

export default async function NewCampaignPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <div>
        <Link href="/dashboard/campaigns">
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 -ml-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Campañas
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva campaña</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCampaign} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre de la campaña *</Label>
              <Input id="name" name="name" required placeholder="Ej: Campaña Municipal 2026" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Descripción</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Describe el objetivo y alcance de la campaña…"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="election_date">Fecha de elección</Label>
              <Input id="election_date" name="election_date" type="date" />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-input accent-indigo-600"
              />
              <Label htmlFor="is_active" className="cursor-pointer font-normal">
                Campaña activa
              </Label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1">Crear campaña</Button>
              <Link href="/dashboard/campaigns">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
