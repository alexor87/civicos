import { describe, it, expect } from 'vitest'
import {
  describeTrigger,
  describeAction,
  TRIGGER_CONFIG,
  ACTION_CONFIG,
  TriggerConfig,
  ActionConfig,
} from '@/components/dashboard/flows/flowTypes'

// ── describeTrigger — nuevos tipos ────────────────────────────

describe('describeTrigger — contact_replied', () => {
  it('describe canal whatsapp', () => {
    const t: TriggerConfig = { type: 'contact_replied', config: { channel: 'whatsapp' } }
    expect(describeTrigger(t)).toContain('WhatsApp')
  })

  it('describe canal sms', () => {
    const t: TriggerConfig = { type: 'contact_replied', config: { channel: 'sms' } }
    expect(describeTrigger(t)).toContain('SMS')
  })

  it('describe canal any', () => {
    const t: TriggerConfig = { type: 'contact_replied', config: { channel: 'any' } }
    expect(describeTrigger(t)).toContain('WhatsApp o SMS')
  })
})

describe('describeTrigger — calendar_date', () => {
  it('describe antes del evento', () => {
    const t: TriggerConfig = { type: 'calendar_date', config: { offset_days: 3, direction: 'before' } }
    const result = describeTrigger(t)
    expect(result).toContain('3')
    expect(result).toContain('antes de')
  })

  it('describe después del evento', () => {
    const t: TriggerConfig = { type: 'calendar_date', config: { offset_days: 1, direction: 'after' } }
    const result = describeTrigger(t)
    expect(result).toContain('1')
    expect(result).toContain('después de')
  })
})

// ── describeAction — nuevos tipos ─────────────────────────────

describe('describeAction — send_sms', () => {
  it('menciona SMS', () => {
    const a: ActionConfig = { type: 'send_sms', config: { message: 'Hola {first_name}' } }
    expect(describeAction(a)).toContain('SMS')
  })
})

describe('describeAction — send_email', () => {
  it('incluye el asunto', () => {
    const a: ActionConfig = { type: 'send_email', config: { subject: 'Te invitamos', body: 'Cuerpo del email' } }
    expect(describeAction(a)).toContain('Te invitamos')
  })
})

describe('describeAction — change_sympathy', () => {
  it('incluye el nivel numérico', () => {
    const a: ActionConfig = { type: 'change_sympathy', config: { level: 4 } }
    expect(describeAction(a)).toContain('4')
  })

  it('incluye la etiqueta del nivel', () => {
    const a: ActionConfig = { type: 'change_sympathy', config: { level: 5 } }
    expect(describeAction(a)).toContain('Muy simpatizante')
  })
})

describe('describeAction — create_calendar_event', () => {
  it('incluye el título del evento', () => {
    const a: ActionConfig = { type: 'create_calendar_event', config: { title: 'Reunión de equipo', days_offset: 2 } }
    expect(describeAction(a)).toContain('Reunión de equipo')
  })

  it('incluye los días de offset', () => {
    const a: ActionConfig = { type: 'create_calendar_event', config: { title: 'Evento', days_offset: 5 } }
    expect(describeAction(a)).toContain('5')
  })
})

describe('describeAction — wait', () => {
  it('incluye los días de espera', () => {
    const a: ActionConfig = { type: 'wait', config: { days: 3 } }
    expect(describeAction(a)).toContain('3')
  })

  it('menciona espera o pausa', () => {
    const a: ActionConfig = { type: 'wait', config: { days: 1 } }
    expect(describeAction(a).toLowerCase()).toMatch(/esper|wait/)
  })
})

// ── TRIGGER_CONFIG — entradas nuevas ──────────────────────────

describe('TRIGGER_CONFIG — nuevos triggers', () => {
  it('tiene entrada para contact_replied', () => {
    expect(TRIGGER_CONFIG['contact_replied']).toBeDefined()
    expect(TRIGGER_CONFIG['contact_replied'].label).toBeTruthy()
  })

  it('tiene entrada para calendar_date', () => {
    expect(TRIGGER_CONFIG['calendar_date']).toBeDefined()
    expect(TRIGGER_CONFIG['calendar_date'].label).toBeTruthy()
  })
})

// ── ACTION_CONFIG — entradas nuevas ───────────────────────────

describe('ACTION_CONFIG — nuevas acciones', () => {
  const newTypes = ['send_sms', 'send_email', 'change_sympathy', 'create_calendar_event', 'wait'] as const

  newTypes.forEach(type => {
    it(`tiene entrada para ${type}`, () => {
      expect(ACTION_CONFIG[type]).toBeDefined()
      expect(ACTION_CONFIG[type].label).toBeTruthy()
    })
  })
})

// ── Tipos existentes siguen funcionando ───────────────────────

describe('describeTrigger — tipos existentes no se rompen', () => {
  it('contact_created', () => {
    const t: TriggerConfig = { type: 'contact_created', config: {} }
    expect(describeTrigger(t)).toBeTruthy()
  })

  it('inactivity', () => {
    const t: TriggerConfig = { type: 'inactivity', config: { days: 30 } }
    expect(describeTrigger(t)).toContain('30')
  })
})

describe('describeAction — tipos existentes no se rompen', () => {
  it('send_whatsapp', () => {
    const a: ActionConfig = { type: 'send_whatsapp', config: { message: 'Hola', fallback: 'sms' } }
    expect(describeAction(a)).toBeTruthy()
  })

  it('add_tag', () => {
    const a: ActionConfig = { type: 'add_tag', config: { tags: ['vip', 'activo'] } }
    expect(describeAction(a)).toContain('vip')
  })
})
