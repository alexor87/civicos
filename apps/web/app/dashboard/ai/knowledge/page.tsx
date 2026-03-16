import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { KnowledgeUploader } from '@/components/dashboard/knowledge/KnowledgeUploader'
import { KnowledgeDocumentList } from '@/components/dashboard/knowledge/KnowledgeDocumentList'
import { VolunteerChatbot } from '@/components/dashboard/knowledge/VolunteerChatbot'
import type { KnowledgeDocumentMetaRow } from '@/lib/types/database'

export default async function KnowledgeBasePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids, role')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0] ?? ''
  const canUpload  = ['super_admin', 'campaign_manager', 'analyst'].includes(profile?.role ?? '')

  const { data: documents } = await supabase
    .from('knowledge_document_meta')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#f6f7f8]">
      <div className="p-6 lg:p-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-[#1b1f23]">Base de Conocimiento</h1>
          <p className="text-sm text-[#6a737d] mt-1">
            Sube documentos de la campaña para que los agentes IA y el chatbot de voluntarios respondan con base en ellos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: uploader + document list */}
          <div className="lg:col-span-2 space-y-6">
            {canUpload && (
              <KnowledgeUploader campaignId={campaignId} />
            )}
            <KnowledgeDocumentList documents={(documents ?? []) as KnowledgeDocumentMetaRow[]} />
          </div>

          {/* Right column: volunteer chatbot */}
          <div>
            <VolunteerChatbot campaignId={campaignId} />
          </div>
        </div>

      </div>
    </div>
  )
}
