export const EVENT_TYPE_CONFIG: Record<string, { color: string; label: string; activatesIntelligence: boolean }> = {
  public_event:        { color: '#1A6FE8', label: 'Mitin',          activatesIntelligence: true  },
  internal_meeting:    { color: '#5C6B7A', label: 'Reunión',         activatesIntelligence: false },
  media_debate:        { color: '#F59E0B', label: 'Debate/Medios',   activatesIntelligence: false },
  canvassing:          { color: '#10B981', label: 'Canvassing',      activatesIntelligence: true  },
  fundraising:         { color: '#D97706', label: 'Recaudación',     activatesIntelligence: true  },
  electoral_date:      { color: '#EF4444', label: 'Fecha Electoral', activatesIntelligence: false },
  institutional_visit: { color: '#7C3AED', label: 'Visita Inst.',    activatesIntelligence: true  },
  media_session:       { color: '#EC4899', label: 'Sesión Medios',   activatesIntelligence: false },
  personal_time:       { color: '#94A3B8', label: 'Personal',        activatesIntelligence: false },
}

export interface CalendarEvent {
  id: string
  title: string
  event_type: string
  status: string
  all_day: boolean
  start_at: string
  end_at: string
  location_text: string | null
  municipality_name: string | null
  municipality_code: string | null
  neighborhood_name: string | null
  description: string | null
  internal_notes: string | null
  expected_attendance: number | null
  actual_attendance: number | null
  post_event_notes: string | null
  post_event_rating: number | null
  completed_at: string | null
  intelligence_status: string
  ai_briefing: Record<string, unknown> | null
  campaign_id: string
  created_at: string
}
