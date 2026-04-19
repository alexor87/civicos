import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { EmailCampaignEditor } from '@/components/dashboard/EmailCampaignEditor'
import { updateCampaign } from '../../actions'
import { extractBlocks, createDefaultBlock, type ExtractedBlocks } from '@/lib/email-blocks'

// Fallback for legacy HTML (no civicos-blocks comment): convert body text to a TextBlock
function legacyFallback(campaign: { name: string; subject: string; segment_id: string | null; body_html: string }): ExtractedBlocks {
  const paragraphMatches = [...campaign.body_html.matchAll(/<p style="margin:0 0 16px 0[^"]*"[^>]*>(.*?)<\/p>/gi)]
  const body = paragraphMatches.map(m => m[1].replace(/<[^>]+>/g, '')).join('\n\n')
  const headlineMatch = campaign.body_html.match(/<h1[^>]*>(.*?)<\/h1>/i)
  const headline = headlineMatch ? headlineMatch[1].replace(/<[^>]+>/g, '') : ''

  const blocks = []
  if (headline) {
    const h = createDefaultBlock('header')
    if (h.type === 'header') h.props.text = headline
    blocks.push(h)
  }
  if (body) {
    const t = createDefaultBlock('text')
    if (t.type === 'text') t.props.content = body
    blocks.push(t)
  }
  if (!blocks.length) blocks.push(createDefaultBlock('text'))

  return {
    blocks,
    meta: {
      name: campaign.name,
      subject: campaign.subject,
      segmentId: campaign.segment_id ?? '',
    },
  }
}

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids, role, email')
    .eq('id', user.id)
    .single()

  const canManage = ['super_admin', 'campaign_manager', 'analyst'].includes(profile?.role ?? '')
  if (!canManage) redirect('/dashboard/comunicaciones')

  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', id)
    .eq('status', 'draft')
    .single()

  if (!campaign) notFound()

  const campaignId = profile?.campaign_ids?.[0] ?? ''
  const { data: segments } = await supabase
    .from('contact_segments')
    .select('id, name')
    .eq('campaign_id', campaignId)
    .order('name', { ascending: true })

  // Try to restore block-based data; fall back for legacy template HTML
  const initialData = extractBlocks(campaign.body_html) ?? legacyFallback(campaign)
  // Always ensure meta has name/subject from DB (authoritative)
  initialData.meta.name = campaign.name
  initialData.meta.subject = campaign.subject
  initialData.meta.segmentId = campaign.segment_id ?? ''

  // Load manual recipients if present
  const recipientIds: string[] = campaign.recipient_ids ?? []
  let recipientContacts: { id: string; first_name: string | null; last_name: string | null; email: string | null }[] = []
  if (recipientIds.length > 0) {
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email')
      .in('id', recipientIds)
    recipientContacts = contacts ?? []
  }

  const boundUpdate = updateCampaign.bind(null, id)

  return (
    <EmailCampaignEditor
      segments={segments ?? []}
      action={boundUpdate}
      submitLabel="Guardar cambios"
      initialData={{ ...initialData, recipientIds, recipientContacts }}
      campaignId={campaignId}
      userEmail={profile?.email ?? user.email ?? ''}
    />
  )
}
