'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

async function createZone(campaignId: string, formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = (formData.get('name') as string).trim()
  const targetContacts = parseInt(formData.get('target_contacts') as string) || 0

  if (!name) return

  await supabase.from('canvass_zones').insert({
    campaign_id: campaignId,
    name,
    target_contacts: targetContacts,
  })

  redirect('/dashboard/canvassing')
}

export default async function NewZonePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0]
  if (!campaignId) notFound()

  const boundCreate = createZone.bind(null, campaignId)

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <div>
        <Link href="/dashboard/canvassing">
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 -ml-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Canvassing
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva zona de canvassing</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={boundCreate} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre de la zona *</Label>
              <Input id="name" name="name" required placeholder="Ej: Barrio Centro, Sector Norte…" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="target_contacts">Objetivo de contactos</Label>
              <Input
                id="target_contacts"
                name="target_contacts"
                type="number"
                min="0"
                placeholder="0"
              />
              <p className="text-xs text-slate-500">Número de contactos a cubrir en esta zona</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1">Crear zona</Button>
              <Link href="/dashboard/canvassing">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
