// ============================================================
// CivicOS Flows — Tipos e interfaces compartidos
// ============================================================

export type TriggerType =
  | 'date_field'
  | 'sympathy_change'
  | 'canvass_result'
  | 'inactivity'
  | 'contact_created'

export type ActionType =
  | 'send_whatsapp'
  | 'create_task'
  | 'add_tag'
  | 'remove_tag'
  | 'notify_team'

export type FlowStatus =
  | 'draft'
  | 'pending_approval'
  | 'active'
  | 'paused'
  | 'archived'
  | 'error'

export type FlowCategory =
  | 'birthday'
  | 'engagement'
  | 'canvassing'
  | 'comms'
  | 'electoral'
  | 'sympathy'
  | 'donations'
  | 'custom'

// ── Configuraciones de Triggers ───────────────────────────────

export interface TriggerDateField {
  type: 'date_field'
  config: {
    field: 'birth_date' | 'created_at' | 'first_visit_at' | 'became_volunteer_at'
    offset_days: number   // 0 = el día exacto, -1 = 1 día antes, etc.
    time: string          // HH:mm, e.g. "08:00"
  }
}

export interface TriggerSympathyChange {
  type: 'sympathy_change'
  config: {
    direction: 'any' | 'up' | 'down'
    from_level?: number   // 1-5, opcional
    to_level?: number     // 1-5, opcional
  }
}

export interface TriggerCanvassResult {
  type: 'canvass_result'
  config: {
    result: 'any' | 'contacted' | 'wants_to_donate' | 'wants_to_volunteer' | 'not_home' | 'no_answer'
    min_attempts?: number  // activar cuando acumule X intentos
  }
}

export interface TriggerInactivity {
  type: 'inactivity'
  config: {
    days: number           // días sin visita
  }
}

export interface TriggerContactCreated {
  type: 'contact_created'
  config: Record<string, never>
}

export type TriggerConfig =
  | TriggerDateField
  | TriggerSympathyChange
  | TriggerCanvassResult
  | TriggerInactivity
  | TriggerContactCreated

// ── Configuraciones de Acciones ────────────────────────────────

export interface ActionSendWhatsApp {
  type: 'send_whatsapp'
  config: {
    message: string          // puede incluir variables {first_name}, {barrio}, etc.
    fallback: 'sms' | 'skip' | 'notify_team'
    send_hour_start?: number // hora mínima de envío (e.g. 8)
    send_hour_end?: number   // hora máxima de envío (e.g. 20)
  }
}

export interface ActionCreateTask {
  type: 'create_task'
  config: {
    title: string
    description?: string
    assigned_to: 'zone_coordinator' | 'assigned_volunteer' | 'campaign_manager' | string
    due_in_hours?: number
  }
}

export interface ActionAddTag {
  type: 'add_tag'
  config: {
    tags: string[]
  }
}

export interface ActionRemoveTag {
  type: 'remove_tag'
  config: {
    tags: string[]
  }
}

export interface ActionNotifyTeam {
  type: 'notify_team'
  config: {
    recipients: 'campaign_manager' | 'all_coordinators' | string[]
    message: string
  }
}

export type ActionConfig =
  | ActionSendWhatsApp
  | ActionCreateTask
  | ActionAddTag
  | ActionRemoveTag
  | ActionNotifyTeam

// ── Filtro de contactos ────────────────────────────────────────

export interface FlowFilter {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'is_null' | 'is_not_null'
  value: unknown
}

// ── Entidades principales ──────────────────────────────────────

export interface AutomationFlow {
  id:                           string
  tenant_id:                    string
  campaign_id:                  string
  name:                         string
  description:                  string | null
  category:                     FlowCategory | null
  icon:                         string | null
  from_template_id:             string | null
  status:                       FlowStatus
  trigger_config:               TriggerConfig
  filter_config:                FlowFilter[]
  actions_config:               ActionConfig[]
  max_executions_per_contact:   number
  execution_window_days:        number | null
  requires_approval:            boolean
  approved_by:                  string | null
  approved_at:                  string | null
  created_by:                   string
  created_at:                   string
  updated_at:                   string
  activated_at:                 string | null
  paused_at:                    string | null
  natural_language_input:       string | null
  ai_generated:                 boolean
  // campos computados (solo en GET list)
  execution_count?:             number
  last_execution_at?:           string | null
}

export interface FlowExecution {
  id:           string
  flow_id:      string
  tenant_id:    string
  contact_id:   string
  status:       'running' | 'completed' | 'partial' | 'failed' | 'skipped'
  triggered_by: string
  actions_log:  ActionLogEntry[]
  error_message: string | null
  started_at:   string
  completed_at: string | null
  // join
  contact_name?: string
}

export interface ActionLogEntry {
  action_index: number
  type:         ActionType
  status:       'success' | 'failed' | 'pending' | 'skipped'
  executed_at?: string
  scheduled_for?: string
  result?:      Record<string, unknown>
  error?:       string
}

export interface FlowTemplate {
  id:             string
  name:           string
  description:    string
  category:       FlowCategory
  icon:           string | null
  trigger_config: TriggerConfig
  filter_config:  FlowFilter[]
  actions_config: ActionConfig[]
  preview_message: string | null
  is_featured:    boolean
  sort_order:     number
  created_at:     string
}

// ── Respuesta de generación IA ─────────────────────────────────

export interface GenerateFlowResponse {
  flowConfig: {
    name:            string
    trigger_config:  TriggerConfig
    filter_config:   FlowFilter[]
    actions_config:  ActionConfig[]
    category:        FlowCategory
    icon:            string
    human_summary:   string
    clarifying_questions: string[]
  }
  previewContact: {
    id:       string
    name:     string
    barrio:   string | null
    municipio: string | null
  } | null
  renderedMessage: string | null
}

// ── Constantes de UI ───────────────────────────────────────────

export const TRIGGER_CONFIG: Record<TriggerType, {
  label:       string
  description: string
  icon:        string
}> = {
  date_field: {
    icon:        '📅',
    label:       'Fecha especial del contacto',
    description: 'Cumpleaños, aniversario de registro, primera visita, etc.',
  },
  sympathy_change: {
    icon:        '📈',
    label:       'Cambio de nivel de simpatía',
    description: 'Cuando el nivel de simpatía sube o baja',
  },
  canvass_result: {
    icon:        '🚪',
    label:       'Resultado de visita de canvassing',
    description: 'Cuando un voluntario registra una visita con un resultado específico',
  },
  inactivity: {
    icon:        '💤',
    label:       'Contacto sin actividad',
    description: 'Cuando un contacto lleva X días sin ser visitado ni contactado',
  },
  contact_created: {
    icon:        '👤',
    label:       'Nuevo contacto creado',
    description: 'Cuando se agrega un nuevo contacto al CRM',
  },
}

export const ACTION_CONFIG: Record<ActionType, {
  label: string
  icon:  string
}> = {
  send_whatsapp: { icon: '💬', label: 'Enviar WhatsApp personalizado' },
  create_task:   { icon: '✅', label: 'Crear tarea para el equipo' },
  add_tag:       { icon: '🏷️', label: 'Agregar tag al contacto' },
  remove_tag:    { icon: '🗑️', label: 'Quitar tag al contacto' },
  notify_team:   { icon: '🔔', label: 'Notificar a un miembro del equipo' },
}

export const FLOW_STATUS_CONFIG: Record<FlowStatus, {
  label: string
  color: string
  bg:    string
}> = {
  active:           { label: 'Activo',            color: 'text-emerald-700', bg: 'bg-emerald-100' },
  paused:           { label: 'Pausado',           color: 'text-amber-700',   bg: 'bg-amber-100'   },
  draft:            { label: 'Borrador',          color: 'text-slate-600',   bg: 'bg-slate-100'   },
  pending_approval: { label: 'Pendiente aprobac.', color: 'text-blue-700',  bg: 'bg-blue-100'    },
  error:            { label: 'Error',             color: 'text-red-700',     bg: 'bg-red-100'     },
  archived:         { label: 'Archivado',         color: 'text-slate-400',   bg: 'bg-slate-50'    },
}

export const CATEGORY_CONFIG: Record<FlowCategory, { label: string; icon: string }> = {
  birthday:   { icon: '🎂', label: 'Fechas especiales' },
  engagement: { icon: '🌡️', label: 'Engagement' },
  canvassing: { icon: '🚪', label: 'Canvassing' },
  comms:      { icon: '📣', label: 'Comunicaciones' },
  electoral:  { icon: '🗳️', label: 'Electoral' },
  sympathy:   { icon: '📈', label: 'Simpatía' },
  donations:  { icon: '💰', label: 'Donaciones' },
  custom:     { icon: '⚡', label: 'Personalizado' },
}

// ── Utilidades de variables ─────────────────────────────────────

export function renderVariables(
  message: string,
  contact: { full_name?: string | null; neighborhood_name?: string | null; municipality_name?: string | null },
  candidateName?: string | null
): string {
  const firstName = contact.full_name?.split(' ')[0] ?? ''
  return message
    .replace(/\{first_name\}/g, firstName)
    .replace(/\{full_name\}/g,  contact.full_name ?? '')
    .replace(/\{barrio\}/g,     contact.neighborhood_name ?? '')
    .replace(/\{municipio\}/g,  contact.municipality_name ?? '')
    .replace(/\{candidate_name\}/g, candidateName ?? '')
    .replace(/\{nombre\}/g,     firstName)   // legacy compat
}

// Descripción en lenguaje natural del trigger para la tarjeta de receta
export function describeTrigger(trigger: TriggerConfig): string {
  switch (trigger.type) {
    case 'date_field': {
      const fieldLabels: Record<string, string> = {
        birth_date:          'cumpleaños',
        created_at:          'aniversario de registro',
        first_visit_at:      'primer visita de canvassing',
        became_volunteer_at: 'aniversario como voluntario',
      }
      const field = fieldLabels[trigger.config.field] ?? trigger.config.field
      const offset = trigger.config.offset_days
      const offsetStr = offset === 0 ? 'el día exacto' : `${Math.abs(offset)} día(s) antes`
      return `Cada día, el sistema revisa si algún contacto tiene su ${field} ${offsetStr}. Se ejecuta a las ${trigger.config.time}.`
    }
    case 'sympathy_change': {
      const dir = { any: 'cambia', up: 'sube', down: 'baja' }[trigger.config.direction]
      if (trigger.config.from_level && trigger.config.to_level)
        return `Cuando el nivel de simpatía ${dir} de ${trigger.config.from_level} a ${trigger.config.to_level}.`
      return `Cuando el nivel de simpatía de un contacto ${dir}.`
    }
    case 'canvass_result': {
      if (trigger.config.result === 'any')
        return 'Cuando un voluntario registra cualquier visita de canvassing.'
      const resultLabels: Record<string, string> = {
        contacted:           'fue contactado exitosamente',
        wants_to_donate:     'dijo que quiere donar',
        wants_to_volunteer:  'quiere ser voluntario',
        not_home:            'no estaba en casa',
        no_answer:           'no contestó',
      }
      return `Cuando un voluntario registra una visita y el contacto ${resultLabels[trigger.config.result] ?? trigger.config.result}.`
    }
    case 'inactivity':
      return `Cuando un contacto lleva más de ${trigger.config.days} días sin ser visitado ni contactado.`
    case 'contact_created':
      return 'Cuando se agrega un nuevo contacto al CRM (por importación, campo o formulario).'
  }
}

// Descripción en lenguaje natural de una acción
export function describeAction(action: ActionConfig): string {
  switch (action.type) {
    case 'send_whatsapp':
      return 'Se envía un WhatsApp personalizado al contacto.'
    case 'create_task':
      return `Se crea una tarea: "${action.config.title}" asignada a ${action.config.assigned_to}.`
    case 'add_tag':
      return `Se agregan los tags: ${action.config.tags.join(', ')}.`
    case 'remove_tag':
      return `Se quitan los tags: ${action.config.tags.join(', ')}.`
    case 'notify_team':
      return `Se notifica al equipo: "${action.config.message}".`
  }
}
