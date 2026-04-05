'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function updateTerritory(territoryId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = ((formData.get('name') as string) ?? '').trim()
  if (!name) return

  const geojsonRaw = (formData.get('geojson') as string) ?? ''
  let geojson = null
  if (geojsonRaw) {
    try { geojson = JSON.parse(geojsonRaw) } catch { geojson = null }
  }

  await supabase.from('territories').update({
    name,
    description: ((formData.get('description') as string) ?? '').trim() || null,
    color: (formData.get('color') as string) || '#1A6FE8',
    status: (formData.get('status') as string) || 'disponible',
    priority: (formData.get('priority') as string) || 'media',
    deadline: (formData.get('deadline') as string) || null,
    estimated_contacts: parseInt((formData.get('estimated_contacts') as string) ?? '') || 0,
    geojson,
    updated_at: new Date().toISOString(),
  }).eq('id', territoryId)

  revalidatePath('/dashboard/canvassing/territories')
  revalidatePath(`/dashboard/canvassing/territories/${territoryId}`)
  redirect(`/dashboard/canvassing/territories/${territoryId}`)
}
