import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const LEVEL_ORDER: Record<string, number> = { anonimo: 0, opinion: 1, completo: 2 }

const MERGE_FIELDS = [
  'first_name', 'last_name', 'phone', 'email',
  'document_type', 'document_number',
  'address', 'department', 'municipality', 'commune',
  'district', 'city',
  'voting_place', 'voting_table',
  'birth_date', 'gender',
  'location_lat', 'location_lng', 'geocoding_status',
] as const

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0]
  if (!campaignId) return NextResponse.json({ error: 'no_campaign' }, { status: 400 })

  const body = await request.json()
  const { sourceId, targetId } = body

  if (!sourceId || !targetId || sourceId === targetId) {
    return NextResponse.json({ error: 'invalid_ids' }, { status: 400 })
  }

  // Fetch both contacts
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('campaign_id', campaignId)
    .is('deleted_at', null)
    .in('id', [sourceId, targetId])

  if (!contacts || contacts.length !== 2) {
    return NextResponse.json({ error: 'contacts_not_found' }, { status: 404 })
  }

  const target = contacts.find(c => c.id === targetId)!
  const source = contacts.find(c => c.id === sourceId)!

  // Build merged data: target wins, source fills gaps
  const updateObj: Record<string, unknown> = {}

  for (const field of MERGE_FIELDS) {
    const targetVal = target[field]
    const sourceVal = source[field]
    if (!targetVal && sourceVal) {
      updateObj[field] = sourceVal
    }
  }

  // contact_level: keep the higher one
  const targetLevel = LEVEL_ORDER[target.contact_level] ?? 0
  const sourceLevel = LEVEL_ORDER[source.contact_level] ?? 0
  if (sourceLevel > targetLevel) {
    updateObj.contact_level = source.contact_level
  }

  // tags: union without duplicates
  const targetTags: string[] = target.tags ?? []
  const sourceTags: string[] = source.tags ?? []
  const mergedTags = [...new Set([...targetTags, ...sourceTags])]
  if (mergedTags.length > targetTags.length) {
    updateObj.tags = mergedTags
  }

  // metadata: deep merge (source as base, target overwrites)
  const sourceMetadata = (source.metadata ?? {}) as Record<string, unknown>
  const targetMetadata = (target.metadata ?? {}) as Record<string, unknown>
  const mergedMetadata = { ...sourceMetadata, ...targetMetadata }
  if (Object.keys(mergedMetadata).length > Object.keys(targetMetadata).length) {
    updateObj.metadata = mergedMetadata
  }

  // notes: concatenate if both have content
  if (source.notes && target.notes && source.notes !== target.notes) {
    updateObj.notes = `${target.notes}\n---\n${source.notes}`
  } else if (source.notes && !target.notes) {
    updateObj.notes = source.notes
  }

  // Apply merge to target
  if (Object.keys(updateObj).length > 0) {
    const { error: updateError } = await supabase
      .from('contacts')
      .update(updateObj)
      .eq('id', targetId)
      .eq('campaign_id', campaignId)

    if (updateError) {
      console.error('[contacts/merge] Update error:', updateError)
      return NextResponse.json({ error: 'merge_failed' }, { status: 500 })
    }
  }

  // Soft-delete the source contact
  const { error: deleteError } = await supabase
    .from('contacts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', sourceId)
    .eq('campaign_id', campaignId)

  if (deleteError) {
    console.error('[contacts/merge] Delete error:', deleteError)
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true, mergedId: targetId })
}
