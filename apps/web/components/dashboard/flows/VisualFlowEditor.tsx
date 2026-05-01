'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X, Plus, ChevronRight, Check } from 'lucide-react'
import {
  TriggerConfig,
  ActionConfig,
  AutomationFlow,
  TRIGGER_CONFIG,
  ACTION_CONFIG,
  TriggerType,
  ActionType,
  FlowCategory,
  CATEGORY_CONFIG,
  describeTrigger,
} from './flowTypes'
import { SMS_CHANNEL_ENABLED, WHATSAPP_CHANNEL_ENABLED } from '@/lib/features/messaging-channels'
import { FlowRecipeCard } from './FlowRecipeCard'

// ── Helpers ─────────────────────────────────────────────────────

function defaultTrigger(type: TriggerType): TriggerConfig {
  switch (type) {
    case 'date_field':        return { type, config: { field: 'birth_date', offset_days: 0, time: '08:00' } }
    case 'sympathy_change':   return { type, config: { direction: 'any' } }
    case 'canvass_result':    return { type, config: { result: 'any' } }
    case 'inactivity':        return { type, config: { days: 21 } }
    case 'contact_created':   return { type, config: {} }
    case 'contact_replied':   return { type, config: { channel: 'whatsapp' } }
    case 'calendar_date':     return { type, config: { offset_days: 1, direction: 'before' } }
  }
}

function defaultAction(type: ActionType): ActionConfig {
  switch (type) {
    case 'send_whatsapp':         return { type, config: { message: 'Hola {first_name}, te contactamos de parte de la campaña.', fallback: 'sms' } }
    case 'send_sms':              return { type, config: { message: 'Hola {first_name}, te contactamos de parte de la campaña.' } }
    case 'send_email':            return { type, config: { subject: 'Mensaje de la campaña', body: 'Hola {first_name},\n\n' } }
    case 'create_task':           return { type, config: { title: 'Seguimiento al contacto', assigned_to: 'zone_coordinator' } }
    case 'add_tag':               return { type, config: { tags: [] } }
    case 'remove_tag':            return { type, config: { tags: [] } }
    case 'notify_team':           return { type, config: { recipients: 'campaign_manager', message: '' } }
    case 'change_sympathy':       return { type, config: { level: 3 } }
    case 'create_calendar_event': return { type, config: { title: 'Seguimiento', days_offset: 1 } }
    case 'wait':                  return { type, config: { days: 1 } }
  }
}

function defaultFlowName(trigger: TriggerConfig): string {
  const labels: Record<TriggerType, string> = {
    date_field:       'Flow de fecha especial',
    sympathy_change:  'Flow de cambio de simpatía',
    canvass_result:   'Flow de canvassing',
    inactivity:       'Flow de reactivación',
    contact_created:  'Flow de bienvenida',
    contact_replied:  'Flow de respuesta',
    calendar_date:    'Flow de evento del calendario',
  }
  return labels[trigger.type]
}

function triggerCategory(trigger: TriggerConfig): FlowCategory {
  const map: Record<TriggerType, FlowCategory> = {
    date_field:      'birthday',
    sympathy_change: 'sympathy',
    canvass_result:  'canvassing',
    inactivity:      'engagement',
    contact_created: 'engagement',
    contact_replied: 'comms',
    calendar_date:   'electoral',
  }
  return map[trigger.type]
}

// ── Step indicator ───────────────────────────────────────────────

const STEPS = [
  { num: 1, label: 'Disparador' },
  { num: 2, label: 'Acciones' },
  { num: 3, label: 'Guardar' },
]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((s, i) => (
        <div key={s.num} className="flex items-center gap-2">
          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
            current === s.num
              ? 'bg-primary text-white'
              : current > s.num
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}>
            {current > s.num ? <Check className="h-3.5 w-3.5" /> : s.num}
          </div>
          <span className={`text-xs font-medium hidden sm:block ${current === s.num ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
            {s.label}
          </span>
          {i < STEPS.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-slate-300 mx-1" />}
        </div>
      ))}
    </div>
  )
}

// ── Trigger config forms ─────────────────────────────────────────

function TriggerConfigForm({
  trigger,
  onChange,
}: {
  trigger: TriggerConfig
  onChange: (t: TriggerConfig) => void
}) {
  const inputCls = 'w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50'
  const labelCls = 'block text-xs font-medium text-slate-500 mb-1'

  switch (trigger.type) {
    case 'date_field':
      return (
        <div className="space-y-3" data-testid="trigger-config-form">
          <div>
            <label className={labelCls}>Campo de fecha</label>
            <select
              data-testid="datefield-field-select"
              className={inputCls}
              value={trigger.config.field}
              onChange={e => onChange({ ...trigger, config: { ...trigger.config, field: e.target.value as typeof trigger.config.field } })}
            >
              <option value="birth_date">Cumpleaños</option>
              <option value="created_at">Aniversario de registro</option>
              <option value="first_visit_at">Primera visita</option>
              <option value="became_volunteer_at">Aniversario como voluntario</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Días antes del evento (0 = el mismo día)</label>
            <input
              data-testid="datefield-offset-input"
              type="number"
              min="0"
              max="30"
              className={inputCls}
              value={Math.abs(trigger.config.offset_days)}
              onChange={e => onChange({ ...trigger, config: { ...trigger.config, offset_days: -Math.abs(Number(e.target.value)) } })}
            />
          </div>
          <div>
            <label className={labelCls}>Hora de envío</label>
            <input
              data-testid="datefield-time-input"
              type="time"
              className={inputCls}
              value={trigger.config.time}
              onChange={e => onChange({ ...trigger, config: { ...trigger.config, time: e.target.value } })}
            />
          </div>
        </div>
      )

    case 'sympathy_change':
      return (
        <div className="space-y-3" data-testid="trigger-config-form">
          <div>
            <label className={labelCls}>Dirección del cambio</label>
            <select
              data-testid="sympathy-direction-select"
              className={inputCls}
              value={trigger.config.direction}
              onChange={e => onChange({ ...trigger, config: { ...trigger.config, direction: e.target.value as 'any' | 'up' | 'down' } })}
            >
              <option value="any">Cualquier cambio</option>
              <option value="up">Solo cuando sube</option>
              <option value="down">Solo cuando baja</option>
            </select>
          </div>
        </div>
      )

    case 'canvass_result':
      return (
        <div className="space-y-3" data-testid="trigger-config-form">
          <div>
            <label className={labelCls}>Resultado de la visita</label>
            <select
              data-testid="canvass-result-select"
              className={inputCls}
              value={trigger.config.result}
              onChange={e => onChange({ ...trigger, config: { ...trigger.config, result: e.target.value as typeof trigger.config.result } })}
            >
              <option value="any">Cualquier resultado</option>
              <option value="contacted">Contactado exitosamente</option>
              <option value="wants_to_donate">Quiere donar</option>
              <option value="wants_to_volunteer">Quiere ser voluntario</option>
              <option value="not_home">No estaba en casa</option>
              <option value="no_answer">No contestó</option>
            </select>
          </div>
        </div>
      )

    case 'inactivity':
      return (
        <div className="space-y-3" data-testid="trigger-config-form">
          <div>
            <label className={labelCls}>Días sin actividad</label>
            <input
              data-testid="inactivity-days-input"
              type="number"
              min="1"
              max="365"
              className={inputCls}
              value={trigger.config.days}
              onChange={e => onChange({ ...trigger, config: { days: Number(e.target.value) } })}
            />
          </div>
        </div>
      )

    case 'contact_created':
      return (
        <div data-testid="trigger-config-form">
          <p className="text-sm text-slate-500">Se activa automáticamente cada vez que se agrega un nuevo contacto al CRM. No requiere configuración adicional.</p>
        </div>
      )

    case 'contact_replied':
      return (
        <div className="space-y-3" data-testid="trigger-config-form">
          <div>
            <label className={labelCls}>Canal del mensaje</label>
            <select
              data-testid="replied-channel-select"
              className={inputCls}
              value={trigger.config.channel}
              onChange={e => onChange({ ...trigger, config: { channel: e.target.value as 'whatsapp' | 'sms' | 'any' } })}
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
              <option value="any">WhatsApp o SMS</option>
            </select>
          </div>
        </div>
      )

    case 'calendar_date':
      return (
        <div className="space-y-3" data-testid="trigger-config-form">
          <div>
            <label className={labelCls}>Días de distancia al evento</label>
            <input
              data-testid="calendar-offset-input"
              type="number"
              min="0"
              max="60"
              className={inputCls}
              value={trigger.config.offset_days}
              onChange={e => onChange({ ...trigger, config: { ...trigger.config, offset_days: Number(e.target.value) } })}
            />
          </div>
          <div>
            <label className={labelCls}>Cuándo ejecutar</label>
            <select
              data-testid="calendar-direction-select"
              className={inputCls}
              value={trigger.config.direction}
              onChange={e => onChange({ ...trigger, config: { ...trigger.config, direction: e.target.value as 'before' | 'after' } })}
            >
              <option value="before">Antes del evento</option>
              <option value="after">Después del evento</option>
            </select>
          </div>
        </div>
      )
  }
}

// ── Action config form ───────────────────────────────────────────

function ActionConfigForm({
  action,
  index,
  onChange,
}: {
  action:   ActionConfig
  index:    number
  onChange: (a: ActionConfig) => void
}) {
  const inputCls = 'w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50'
  const labelCls = 'block text-xs font-medium text-slate-500 mb-1'

  switch (action.type) {
    case 'send_whatsapp':
      return (
        <div className="space-y-2">
          <label className={labelCls}>Mensaje (puedes usar {'{first_name}'}, {'{barrio}'})</label>
          <textarea
            data-testid={`action-card-${index}-whatsapp-message`}
            rows={3}
            className={inputCls + ' resize-none'}
            value={action.config.message}
            onChange={e => onChange({ ...action, config: { ...action.config, message: e.target.value } })}
          />
        </div>
      )
    case 'send_sms':
      return (
        <div className="space-y-2">
          <label className={labelCls}>Mensaje SMS (puedes usar {'{first_name}'}, {'{barrio}'})</label>
          <textarea
            data-testid={`action-card-${index}-sms-message`}
            rows={3}
            className={inputCls + ' resize-none'}
            value={action.config.message}
            onChange={e => onChange({ ...action, config: { message: e.target.value } })}
          />
        </div>
      )
    case 'send_email':
      return (
        <div className="space-y-2">
          <div>
            <label className={labelCls}>Asunto</label>
            <input
              data-testid={`action-card-${index}-email-subject`}
              type="text"
              className={inputCls}
              value={action.config.subject}
              onChange={e => onChange({ ...action, config: { ...action.config, subject: e.target.value } })}
            />
          </div>
          <div>
            <label className={labelCls}>Cuerpo del email</label>
            <textarea
              data-testid={`action-card-${index}-email-body`}
              rows={4}
              className={inputCls + ' resize-none'}
              value={action.config.body}
              onChange={e => onChange({ ...action, config: { ...action.config, body: e.target.value } })}
            />
          </div>
        </div>
      )
    case 'create_task':
      return (
        <div className="space-y-2">
          <div>
            <label className={labelCls}>Título de la tarea</label>
            <input
              data-testid={`action-card-${index}-task-title`}
              type="text"
              className={inputCls}
              value={action.config.title}
              onChange={e => onChange({ ...action, config: { ...action.config, title: e.target.value } })}
            />
          </div>
          <div>
            <label className={labelCls}>Asignar a</label>
            <select
              data-testid={`action-card-${index}-task-assigned`}
              className={inputCls}
              value={action.config.assigned_to}
              onChange={e => onChange({ ...action, config: { ...action.config, assigned_to: e.target.value } })}
            >
              <option value="zone_coordinator">Coordinador de zona</option>
              <option value="campaign_manager">Gerente de campaña</option>
              <option value="assigned_volunteer">Voluntario asignado</option>
            </select>
          </div>
        </div>
      )
    case 'add_tag':
    case 'remove_tag':
      return (
        <div className="space-y-2">
          <label className={labelCls}>Tags (separados por coma)</label>
          <input
            data-testid={`action-card-${index}-tags-input`}
            type="text"
            className={inputCls}
            value={action.config.tags.join(', ')}
            onChange={e => onChange({ ...action, config: { tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) } })}
            placeholder="ej: voluntario, contactado"
          />
        </div>
      )
    case 'notify_team':
      return (
        <div className="space-y-2">
          <div>
            <label className={labelCls}>Destinatarios</label>
            <select
              data-testid={`action-card-${index}-notify-recipients`}
              className={inputCls}
              value={typeof action.config.recipients === 'string' ? action.config.recipients : 'all_coordinators'}
              onChange={e => onChange({ ...action, config: { ...action.config, recipients: e.target.value as 'campaign_manager' | 'all_coordinators' } })}
            >
              <option value="campaign_manager">Gerente de campaña</option>
              <option value="all_coordinators">Todos los coordinadores</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Mensaje de notificación</label>
            <input
              data-testid={`action-card-${index}-notify-message`}
              type="text"
              className={inputCls}
              value={action.config.message}
              onChange={e => onChange({ ...action, config: { ...action.config, message: e.target.value } })}
            />
          </div>
        </div>
      )
    case 'change_sympathy':
      return (
        <div className="space-y-2">
          <label className={labelCls}>Nuevo nivel de simpatía</label>
          <select
            data-testid={`action-card-${index}-sympathy-level`}
            className={inputCls}
            value={action.config.level}
            onChange={e => onChange({ ...action, config: { level: Number(e.target.value) as 1|2|3|4|5 } })}
          >
            <option value={1}>1 — Muy bajo</option>
            <option value={2}>2 — Bajo</option>
            <option value={3}>3 — Neutro</option>
            <option value={4}>4 — Simpatizante</option>
            <option value={5}>5 — Muy simpatizante</option>
          </select>
        </div>
      )
    case 'create_calendar_event':
      return (
        <div className="space-y-2">
          <div>
            <label className={labelCls}>Título del evento</label>
            <input
              data-testid={`action-card-${index}-event-title`}
              type="text"
              className={inputCls}
              value={action.config.title}
              onChange={e => onChange({ ...action, config: { ...action.config, title: e.target.value } })}
            />
          </div>
          <div>
            <label className={labelCls}>Días después del trigger</label>
            <input
              data-testid={`action-card-${index}-event-days`}
              type="number"
              min="0"
              max="365"
              className={inputCls}
              value={action.config.days_offset}
              onChange={e => onChange({ ...action, config: { ...action.config, days_offset: Number(e.target.value) } })}
            />
          </div>
        </div>
      )
    case 'wait':
      return (
        <div className="space-y-2">
          <label className={labelCls}>Días de espera</label>
          <input
            data-testid={`action-card-${index}-wait-days`}
            type="number"
            min="1"
            max="365"
            className={inputCls}
            value={action.config.days}
            onChange={e => onChange({ ...action, config: { days: Number(e.target.value) } })}
          />
          <p className="text-[11px] text-slate-400">El flow esperará {action.config.days} día(s) antes de ejecutar la siguiente acción.</p>
        </div>
      )
  }
}

// ── Action type picker ───────────────────────────────────────────

const MESSAGING_TYPES: ActionType[] = [
  ...(WHATSAPP_CHANNEL_ENABLED ? (['send_whatsapp'] as ActionType[]) : []),
  ...(SMS_CHANNEL_ENABLED      ? (['send_sms']      as ActionType[]) : []),
  'send_email',
]

const ACTION_GROUPS: { label: string; types: ActionType[] }[] = [
  { label: 'Mensajes', types: MESSAGING_TYPES },
  { label: 'Datos del contacto', types: ['add_tag', 'remove_tag', 'change_sympathy'] },
  { label: 'Tareas y eventos', types: ['create_task', 'notify_team', 'create_calendar_event'] },
  { label: 'Control', types: ['wait'] },
]

function ActionTypePicker({ onSelect }: { onSelect: (type: ActionType) => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-3 space-y-3 mt-2">
      {ACTION_GROUPS.map(group => (
        <div key={group.label}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{group.label}</p>
          <div className="space-y-1">
            {group.types.map(type => {
              const cfg = ACTION_CONFIG[type]
              return (
                <button
                  key={type}
                  data-testid={`action-type-${type}`}
                  onClick={() => onSelect(type)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <span>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────

interface VisualFlowEditorProps {
  initialFlow?: AutomationFlow
}

export function VisualFlowEditor({ initialFlow }: VisualFlowEditorProps = {}) {
  const router  = useRouter()
  const isEdit  = !!initialFlow

  const [step, setStep]               = useState<1 | 2 | 3>(1)
  const [trigger, setTrigger]         = useState<TriggerConfig | null>(
    (initialFlow?.trigger_config as TriggerConfig) ?? null
  )
  const [actions, setActions]         = useState<ActionConfig[]>(
    (initialFlow?.actions_config as ActionConfig[]) ?? []
  )
  const [showPicker, setShowPicker]   = useState(false)
  const [flowName, setFlowName]       = useState(initialFlow?.name ?? '')
  const [saving, setSaving]           = useState(false)
  const [saveError, setSaveError]     = useState<string | null>(null)

  // Hide `contact_replied` trigger when neither SMS nor WhatsApp is enabled
  const triggerTypes = (Object.keys(TRIGGER_CONFIG) as TriggerType[]).filter(t =>
    t === 'contact_replied' ? (SMS_CHANNEL_ENABLED || WHATSAPP_CHANNEL_ENABLED) : true
  )

  function selectTrigger(type: TriggerType) {
    setTrigger(defaultTrigger(type))
  }

  function addAction(type: ActionType) {
    setActions(prev => [...prev, defaultAction(type)])
    setShowPicker(false)
  }

  function removeAction(index: number) {
    setActions(prev => prev.filter((_, i) => i !== index))
  }

  function updateAction(index: number, updated: ActionConfig) {
    setActions(prev => prev.map((a, i) => i === index ? updated : a))
  }

  function goToStep2() {
    if (!trigger) return
    setStep(2)
  }

  function goToStep3() {
    if (actions.length === 0) return
    // En modo creación, pre-llenar el nombre basado en el trigger
    // En modo edición, conservar el nombre existente
    if (!isEdit && !flowName) {
      setFlowName(trigger ? defaultFlowName(trigger) : 'Mi Flow')
    }
    setStep(3)
  }

  async function saveFlow(status: 'draft' | 'active') {
    if (!trigger) return
    setSaving(true)
    setSaveError(null)
    try {
      const url    = isEdit ? `/api/flows/${initialFlow!.id}` : '/api/flows'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:           flowName,
          trigger_config: trigger,
          filter_config:  [],
          actions_config: actions,
          status,
          category:       triggerCategory(trigger),
          ai_generated:   false,
        }),
      })
      if (res.ok) {
        const flow = await res.json()
        const flowId = isEdit ? initialFlow!.id : flow.id
        router.push(`/dashboard/automatizaciones/${flowId}`)
      } else {
        setSaveError('No se pudo guardar el flow. Intenta de nuevo.')
      }
    } finally {
      setSaving(false)
    }
  }

  const btnPrimary = 'inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50'
  const btnSecondary = 'inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50'

  return (
    <div data-testid="visual-flow-editor" className="max-w-2xl mx-auto">
      {isEdit && (
        <div data-testid="edit-mode-indicator" className="mb-4 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg px-4 py-2 text-sm font-medium border border-amber-200 dark:border-amber-800">
          <span>Editando flow: <strong>{initialFlow!.name}</strong></span>
        </div>
      )}
      <StepIndicator current={step} />

      {/* ── Paso 1: Trigger ── */}
      {step === 1 && (
        <div data-testid="step-1">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">¿Cuándo se activa este flow?</h2>
          <p className="text-sm text-slate-500 mb-4">Elige el evento que dispara las acciones.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {triggerTypes.map(type => {
              const cfg = TRIGGER_CONFIG[type]
              const selected = trigger?.type === type
              return (
                <button
                  key={type}
                  data-testid={`trigger-card-${type}`}
                  data-selected={selected ? 'true' : 'false'}
                  onClick={() => selectTrigger(type)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                    selected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary/40'
                  }`}
                >
                  <span className="text-xl mt-0.5">{cfg.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">{cfg.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{cfg.description}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {trigger && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Configurar disparador</p>
              <TriggerConfigForm trigger={trigger} onChange={setTrigger} />
            </div>
          )}

          <div className="flex justify-end">
            <button
              data-testid="step1-next-btn"
              onClick={goToStep2}
              disabled={!trigger}
              className={btnPrimary}
            >
              Siguiente — Definir acciones <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Paso 2: Acciones ── */}
      {step === 2 && trigger && (
        <div data-testid="step-2">
          <div className="flex items-center gap-2 mb-4">
            <button
              data-testid="selected-trigger-chip"
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-semibold hover:bg-primary/20 transition-colors"
            >
              <span>{TRIGGER_CONFIG[trigger.type].icon}</span>
              <span>{TRIGGER_CONFIG[trigger.type].label}</span>
              <span className="text-primary/60">← cambiar</span>
            </button>
          </div>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">¿Qué debe hacer el flow?</h2>
          <p className="text-sm text-slate-500 mb-4">Agrega una o más acciones en orden de ejecución.</p>

          {/* Action cards */}
          <div className="space-y-3 mb-4">
            {actions.map((action, i) => {
              const cfg = ACTION_CONFIG[action.type]
              return (
                <div
                  key={i}
                  data-testid={`action-card-${i}`}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{cfg.icon} {cfg.label}</span>
                    </div>
                    <button
                      data-testid={`action-card-${i}-remove`}
                      onClick={() => removeAction(i)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      aria-label="Eliminar acción"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <ActionConfigForm action={action} index={i} onChange={updated => updateAction(i, updated)} />
                </div>
              )
            })}
          </div>

          {/* Add action */}
          <div className="relative mb-6">
            <button
              data-testid="add-action-btn"
              onClick={() => setShowPicker(v => !v)}
              className={`${btnSecondary} w-full justify-center`}
            >
              <Plus className="h-4 w-4" /> Agregar acción
            </button>
            {showPicker && (
              <ActionTypePicker onSelect={addAction} />
            )}
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className={btnSecondary}>← Volver</button>
            <button
              data-testid="step2-next-btn"
              onClick={goToStep3}
              disabled={actions.length === 0}
              className={btnPrimary}
            >
              Siguiente — Nombrar y guardar <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Paso 3: Nombre y guardar ── */}
      {step === 3 && trigger && (
        <div data-testid="step-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Nombra tu flow y guárdalo</h2>
          <p className="text-sm text-slate-500 mb-4">Revisa el resumen y elige cómo guardarlo.</p>

          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-1">Nombre del flow</label>
            <input
              data-testid="flow-name-input"
              type="text"
              value={flowName}
              onChange={e => setFlowName(e.target.value)}
              className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Summary */}
          <div className="mb-6">
            <FlowRecipeCard
              name={flowName}
              trigger_config={trigger}
              filter_config={[]}
              actions_config={actions}
            />
          </div>

          {saveError && (
            <div data-testid="save-error" className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
              {saveError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button onClick={() => setStep(2)} className={btnSecondary} disabled={saving}>← Volver</button>
            <button
              data-testid="save-draft-btn"
              onClick={() => saveFlow('draft')}
              disabled={saving || !flowName.trim()}
              className={btnSecondary}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isEdit ? 'Guardar cambios' : 'Guardar como borrador'}
            </button>
            <button
              data-testid="activate-btn"
              onClick={() => saveFlow('active')}
              disabled={saving || !flowName.trim()}
              className={btnPrimary}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Activar Flow
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
