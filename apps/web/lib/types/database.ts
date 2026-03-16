export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'super_admin' | 'campaign_manager' | 'field_coordinator' | 'volunteer' | 'analyst'
export type ContactStatus = 'undecided' | 'supporter' | 'opponent' | 'unknown'
export type VisitResult =
  | 'positive' | 'negative' | 'undecided' | 'no_home' | 'follow_up' | 'refused'
  | 'contacted' | 'not_home' | 'neighbor_absent' | 'moved' | 'wrong_address'
  | 'deceased' | 'come_back_later' | 'inaccessible'

export type VisitStatus = 'submitted' | 'approved' | 'rejected'
export type TerritoryStatus = 'disponible' | 'asignado' | 'en_progreso' | 'completado' | 'archivado'
export type TerritoryPriority = 'alta' | 'media' | 'baja'
export type AssignmentStatus = 'active' | 'completed' | 'cancelled'
export type SuggestionStatus = 'active' | 'pending_approval' | 'approved' | 'rejected' | 'applied' | 'dismissed'

export type SmsCampaignStatus = 'draft' | 'sent' | 'failed'
export type SmsCampaignRow = {
  id: string
  tenant_id: string
  campaign_id: string | null
  name: string
  body_text: string
  segment_id: string | null
  status: SmsCampaignStatus
  recipient_count: number
  sent_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type EmailCampaignStatus = 'draft' | 'sent' | 'failed'
export type EmailCampaignRow = {
  id: string
  tenant_id: string
  campaign_id: string | null
  name: string
  subject: string
  body_html: string
  body_text: string | null
  segment_id: string | null
  status: EmailCampaignStatus
  recipient_count: number
  sent_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type SegmentFilterField = 'status' | 'department' | 'municipality' | 'gender' | 'tags' | 'has_visits' | 'sympathy_level' | 'vote_intention'
export type SegmentFilterOperator = 'eq' | 'neq' | 'contains' | 'is_true' | 'is_false' | 'gte' | 'lte'
export type SegmentFilter = {
  field: SegmentFilterField
  operator: SegmentFilterOperator
  value: string | number | boolean
}
export type ContactSegmentRow = {
  id: string
  tenant_id: string
  campaign_id: string | null
  name: string
  description: string | null
  filters: SegmentFilter[]
  created_by: string | null
  created_at: string
  updated_at: string
}
export type AgentRunStatus = 'running' | 'completed' | 'failed' | 'pending_approval'
export type CampaignChannel = 'email' | 'sms' | 'whatsapp'
export type SuggestionPriority = 'critical' | 'high' | 'medium' | 'low'

// ── WhatsApp ──────────────────────────────────────────────────────────────────
export type WhatsAppCampaignStatus = 'draft' | 'sent' | 'failed'
export interface WhatsAppCampaignRow {
  id: string
  tenant_id: string
  campaign_id: string
  name: string
  template_name: string
  template_variables: Record<string, string>
  segment_id: string | null
  status: WhatsAppCampaignStatus
  recipient_count: number
  sent_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}
export interface WhatsAppConversationRow {
  id: string
  tenant_id: string
  campaign_id: string | null
  whatsapp_campaign_id: string | null
  contact_id: string | null
  direction: 'inbound' | 'outbound'
  body: string
  twilio_message_sid: string | null
  status: string
  created_at: string
}
export interface WhatsAppChatbotConfigRow {
  id: string
  tenant_id: string
  campaign_id: string
  enabled: boolean
  system_prompt: string
  fallback_message: string
  created_at: string
  updated_at: string
}

// ── Knowledge Base ────────────────────────────────────────────────────────────
export interface KnowledgeDocumentRow {
  id: string
  tenant_id: string
  campaign_id: string
  meta_id: string | null
  title: string
  content: string
  file_path: string | null
  file_type: 'pdf' | 'txt' | 'docx' | 'md' | null
  chunk_index: number
  embedding: number[] | null
  token_count: number | null
  created_by: string | null
  created_at: string
}
export interface KnowledgeDocumentMetaRow {
  id: string
  tenant_id: string
  campaign_id: string
  title: string
  file_path: string | null
  file_type: string | null
  total_chunks: number
  total_tokens: number
  created_by: string | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          plan: 'starter' | 'pro' | 'campaign' | 'enterprise'
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>
      }
      campaigns: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          election_date: string | null
          config: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['campaigns']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['campaigns']['Insert']>
      }
      teams: {
        Row: {
          id: string
          tenant_id: string
          campaign_id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['teams']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['teams']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          tenant_id: string
          role: UserRole
          campaign_ids: string[]
          full_name: string | null
          avatar_url: string | null
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      contacts: {
        Row: {
          id: string
          tenant_id: string
          campaign_id: string
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          district: string | null
          status: ContactStatus
          tags: string[]
          notes: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['contacts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['contacts']['Insert']>
      }
      canvass_zones: {
        Row: {
          id: string
          tenant_id: string
          campaign_id: string
          name: string
          geojson: Json
          assigned_team_id: string | null
          target_contacts: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['canvass_zones']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['canvass_zones']['Insert']>
      }
      canvass_visits: {
        Row: {
          id: string
          tenant_id: string
          campaign_id: string
          contact_id: string
          zone_id: string | null
          territory_id: string | null
          volunteer_id: string
          result: VisitResult
          notes: string | null
          metadata: Json
          attempt_number: number
          sympathy_level: number | null
          vote_intention: string | null
          persuadability: string | null
          script_id: string | null
          script_responses: Json | null
          script_completed: boolean
          wants_to_volunteer: boolean
          wants_to_donate: boolean
          wants_more_info: boolean
          wants_yard_sign: boolean
          requested_followup: boolean
          followup_channel: string | null
          followup_notes: string | null
          best_contact_time: string | null
          household_size: number | null
          household_voters: number | null
          new_contacts_found: Json | null
          address_confirmed: boolean
          address_notes: string | null
          was_offline: boolean
          status: VisitStatus
          rejection_reason: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          synced_at: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['canvass_visits']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['canvass_visits']['Insert']>
      }
      territories: {
        Row: {
          id: string
          tenant_id: string
          campaign_id: string
          name: string
          description: string | null
          color: string
          status: TerritoryStatus
          priority: TerritoryPriority
          deadline: string | null
          estimated_contacts: number
          geojson: Json | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['territories']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['territories']['Insert']>
      }
      territory_assignments: {
        Row: {
          id: string
          tenant_id: string
          territory_id: string
          volunteer_id: string
          assigned_by: string
          start_date: string | null
          end_date: string | null
          status: AssignmentStatus
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['territory_assignments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['territory_assignments']['Insert']>
      }
      canvass_scripts: {
        Row: {
          id: string
          tenant_id: string
          campaign_id: string
          name: string
          description: string | null
          questions: Json
          is_active: boolean
          version: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['canvass_scripts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['canvass_scripts']['Insert']>
      }
      communications: {
        Row: {
          id: string
          tenant_id: string
          campaign_id: string
          name: string
          channel: CampaignChannel
          subject: string | null
          content: string
          status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
          scheduled_at: string | null
          sent_at: string | null
          metrics: Json
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['communications']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['communications']['Insert']>
      }
      ai_suggestions: {
        Row: {
          id: string
          tenant_id: string
          campaign_id: string
          type: string
          module: string
          priority: SuggestionPriority
          title: string
          description: string
          reasoning: string | null
          estimated_impact: string | null
          action_payload: Json
          agent_id: string | null
          status: SuggestionStatus
          feedback: string | null
          applied_at: string | null
          dismissed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['ai_suggestions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['ai_suggestions']['Insert']>
      }
      contact_segments: {
        Row: ContactSegmentRow
        Insert: Omit<ContactSegmentRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ContactSegmentRow, 'id' | 'created_at'>>
      }
      email_campaigns: {
        Row: EmailCampaignRow
        Insert: Omit<EmailCampaignRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<EmailCampaignRow, 'id' | 'created_at'>>
      }
      sms_campaigns: {
        Row: SmsCampaignRow
        Insert: Omit<SmsCampaignRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SmsCampaignRow, 'id' | 'created_at'>>
      }
      agent_runs: {
        Row: {
          id: string
          tenant_id: string
          campaign_id: string
          agent_id: string
          workflow_id: string
          status: AgentRunStatus
          trigger: string
          steps: Json
          result: Json
          error: string | null
          started_at: string
          completed_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['agent_runs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['agent_runs']['Insert']>
      }
      whatsapp_campaigns: {
        Row: WhatsAppCampaignRow
        Insert: Omit<WhatsAppCampaignRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<WhatsAppCampaignRow, 'id' | 'created_at'>>
      }
      whatsapp_conversations: {
        Row: WhatsAppConversationRow
        Insert: Omit<WhatsAppConversationRow, 'id' | 'created_at'>
        Update: Partial<Omit<WhatsAppConversationRow, 'id' | 'created_at'>>
      }
      whatsapp_chatbot_config: {
        Row: WhatsAppChatbotConfigRow
        Insert: Omit<WhatsAppChatbotConfigRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<WhatsAppChatbotConfigRow, 'id' | 'created_at'>>
      }
      knowledge_documents: {
        Row: KnowledgeDocumentRow
        Insert: Omit<KnowledgeDocumentRow, 'id' | 'created_at'>
        Update: Partial<Omit<KnowledgeDocumentRow, 'id' | 'created_at'>>
      }
      knowledge_document_meta: {
        Row: KnowledgeDocumentMetaRow
        Insert: Omit<KnowledgeDocumentMetaRow, 'id' | 'created_at'>
        Update: Partial<Omit<KnowledgeDocumentMetaRow, 'id' | 'created_at'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      contact_status: ContactStatus
      visit_result: VisitResult
      visit_status: VisitStatus
      territory_status: TerritoryStatus
      territory_priority: TerritoryPriority
      assignment_status: AssignmentStatus
      suggestion_status: SuggestionStatus
      agent_run_status: AgentRunStatus
      suggestion_priority: SuggestionPriority
    }
  }
}
