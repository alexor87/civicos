'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { SegmentFilter } from '@/lib/types/database'

// ── applyFilters ─────────────────────────────────────────────────────────────
// Translates a SegmentFilter[] into Supabase query builder calls.
// Returns { data, count, error }.

export async function applyFilters(
  supabase: Awaited<ReturnType<typeof createClient>>,
  campaignId: string,
  filters: SegmentFilter[],
) {
  // For has_visits filter we need a sub-query
  const hasVisitsTrue  = filters.find(f => f.field === 'has_visits' && f.operator === 'is_true')
  const hasVisitsFalse = filters.find(f => f.field === 'has_visits' && f.operator === 'is_false')

  let visitContactIds: string[] | null = null
  if (hasVisitsTrue || hasVisitsFalse) {
    const { data: visits } = await supabase
      .from('canvass_visits')
      .select('contact_id')
      .eq('campaign_id', campaignId)
    visitContactIds = visits?.map((v: { contact_id: string }) => v.contact_id) ?? []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = supabase
    .from('contacts')
    .select('id, first_name, last_name, status, department, municipality, gender, tags, created_at', { count: 'exact' })
    .eq('campaign_id', campaignId)

  for (const f of filters) {
    switch (f.field) {
      case 'status':
        q = f.operator === 'eq' ? q.eq('status', f.value) : q.neq('status', f.value)
        break
      case 'department':
        q = q.eq('department', f.value)
        break
      case 'municipality':
        q = q.eq('municipality', f.value)
        break
      case 'gender':
        q = q.eq('gender', f.value)
        break
      case 'tags':
        q = q.contains('tags', [f.value])
        break
      case 'has_visits':
        if (visitContactIds !== null) {
          if (f.operator === 'is_true') {
            q = visitContactIds.length > 0
              ? q.in('id', visitContactIds)
              : q.in('id', ['00000000-0000-0000-0000-000000000000']) // no match
          } else {
            q = visitContactIds.length > 0
              ? q.not('id', 'in', `(${visitContactIds.map(id => `'${id}'`).join(',')})`)
              : q // all contacts have no visits
          }
        }
        break
      case 'sympathy_level':
        // stored in metadata JSONB
        if (f.operator === 'gte') {
          q = q.gte('metadata->>sympathy_level', f.value)
        } else {
          q = q.lte('metadata->>sympathy_level', f.value)
        }
        break
      case 'vote_intention':
        q = q.eq('metadata->>vote_intention', f.value)
        break
    }
  }

  return q.order('created_at', { ascending: false }).limit(200)
}

// ── createSegment ─────────────────────────────────────────────────────────────

export async function createSegment(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids')
    .eq('id', user.id)
    .single()

  const name = (formData.get('name') as string)?.trim()
  if (!name) return

  let filters: SegmentFilter[] = []
  try {
    filters = JSON.parse(formData.get('filters') as string ?? '[]')
  } catch {
    filters = []
  }

  const { data, error } = await supabase
    .from('contact_segments')
    .insert({
      tenant_id: profile?.tenant_id,
      campaign_id: profile?.campaign_ids?.[0] ?? null,
      name,
      description: (formData.get('description') as string) || null,
      filters,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return

  redirect(`/dashboard/contacts/segments/${data.id}`)
}

// ── deleteSegment ─────────────────────────────────────────────────────────────

export async function deleteSegment(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('campaign_ids').eq('id', user.id).single()

  const { data: segment } = await supabase
    .from('contact_segments').select('campaign_id').eq('id', id).single()
  if (!segment || !profile?.campaign_ids?.includes(segment.campaign_id)) redirect('/dashboard/contacts/segments')

  await supabase.from('contact_segments').delete().eq('id', id)
  redirect('/dashboard/contacts/segments')
}
