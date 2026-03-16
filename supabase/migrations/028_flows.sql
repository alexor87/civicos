-- ============================================================
-- Migration 028: CivicOS Flows — Motor de Automatizaciones
-- Tablas: automation_flows, flow_executions, flow_templates
-- Seed: 10 plantillas predefinidas
-- ============================================================

-- ── Tabla principal de flows ──────────────────────────────────

CREATE TABLE IF NOT EXISTS automation_flows (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID NOT NULL,
  campaign_id                 UUID NOT NULL,

  -- Identidad
  name                        TEXT NOT NULL,
  description                 TEXT,
  category                    TEXT,
  -- 'birthday' | 'engagement' | 'canvassing' | 'comms' | 'electoral' | 'sympathy' | 'donations' | 'custom'
  icon                        TEXT,
  from_template_id            UUID REFERENCES automation_flows(id),

  -- Estado
  status                      TEXT NOT NULL DEFAULT 'draft',
  -- 'draft' | 'pending_approval' | 'active' | 'paused' | 'archived' | 'error'

  -- Definición del Flow (JSON estructurado)
  trigger_config              JSONB NOT NULL,
  filter_config               JSONB NOT NULL DEFAULT '[]',
  actions_config              JSONB NOT NULL DEFAULT '[]',

  -- Límites de ejecución
  max_executions_per_contact  INTEGER NOT NULL DEFAULT 1,
  execution_window_days       INTEGER,

  -- Aprobación
  requires_approval           BOOLEAN NOT NULL DEFAULT false,
  approved_by                 UUID,
  approved_at                 TIMESTAMPTZ,

  -- Auditoría
  created_by                  UUID NOT NULL,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at                TIMESTAMPTZ,
  paused_at                   TIMESTAMPTZ,

  -- Metadata IA
  natural_language_input      TEXT,
  ai_generated                BOOLEAN NOT NULL DEFAULT false
);

-- ── Historial de ejecuciones ──────────────────────────────────

CREATE TABLE IF NOT EXISTS flow_executions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id       UUID NOT NULL REFERENCES automation_flows(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL,
  contact_id    UUID NOT NULL,

  -- Estado
  status        TEXT NOT NULL DEFAULT 'running',
  -- 'running' | 'completed' | 'partial' | 'failed' | 'skipped'

  triggered_by  TEXT NOT NULL,

  -- Log de acciones ejecutadas
  actions_log   JSONB NOT NULL DEFAULT '[]',

  error_message TEXT,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ
);

-- ── Biblioteca de plantillas ──────────────────────────────────

CREATE TABLE IF NOT EXISTS flow_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT NOT NULL,
  category        TEXT NOT NULL,
  icon            TEXT,
  trigger_config  JSONB NOT NULL,
  filter_config   JSONB NOT NULL DEFAULT '[]',
  actions_config  JSONB NOT NULL,
  preview_message TEXT,
  is_featured     BOOLEAN NOT NULL DEFAULT false,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Índices ───────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_flows_campaign   ON automation_flows(campaign_id);
CREATE INDEX IF NOT EXISTS idx_flows_tenant     ON automation_flows(tenant_id);
CREATE INDEX IF NOT EXISTS idx_flows_status     ON automation_flows(status);
CREATE INDEX IF NOT EXISTS idx_executions_flow  ON flow_executions(flow_id);
CREATE INDEX IF NOT EXISTS idx_executions_contact ON flow_executions(contact_id);
CREATE INDEX IF NOT EXISTS idx_executions_tenant  ON flow_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_executions_status  ON flow_executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_started ON flow_executions(started_at DESC);

-- ── Row Level Security ─────────────────────────────────────────

ALTER TABLE automation_flows  ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_executions   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_automation_flows" ON automation_flows
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE POLICY "tenant_isolation_flow_executions" ON flow_executions
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

-- flow_templates es pública (sin RLS — son plantillas globales del sistema)

-- ── Seed: 10 Plantillas ────────────────────────────────────────

INSERT INTO flow_templates (name, description, category, icon, trigger_config, filter_config, actions_config, preview_message, is_featured, sort_order) VALUES

-- 1. Cumpleaños por WhatsApp
(
  'Saludo de cumpleaños por WhatsApp',
  'Envía un mensaje de WhatsApp personalizado a cada contacto el día de su cumpleaños.',
  'birthday',
  '🎂',
  '{"type": "date_field", "config": {"field": "birth_date", "offset_days": 0, "time": "08:00"}}',
  '[]',
  '[{"type": "send_whatsapp", "config": {"message": "¡Feliz cumpleaños, {first_name}! 🎂\n\nEl candidato y todo el equipo de campaña te desean un día muy especial.\n\n¡Gracias por tu apoyo!", "fallback": "sms", "send_hour_start": 8, "send_hour_end": 20}}]',
  '¡Feliz cumpleaños, María! 🎂\n\nEl candidato y todo el equipo de campaña te desean un día muy especial.\n\n¡Gracias por tu apoyo!',
  true,
  1
),

-- 2. Aniversario de registro
(
  'Aniversario de registro como contacto',
  'Reconoce el aniversario del día en que el contacto se unió a la campaña.',
  'birthday',
  '🎉',
  '{"type": "date_field", "config": {"field": "created_at", "offset_days": 0, "time": "09:00"}}',
  '[]',
  '[{"type": "send_whatsapp", "config": {"message": "Hola, {first_name}! 🎉\n\nHoy hace exactamente un año que te uniste a nuestra campaña. ¡Gracias por tu apoyo y por creer en nosotros!", "fallback": "sms", "send_hour_start": 9, "send_hour_end": 18}}]',
  'Hola, María! 🎉\n\nHoy hace exactamente un año que te uniste a nuestra campaña. ¡Gracias por tu apoyo y por creer en nosotros!',
  false,
  2
),

-- 3. Reactivar contacto inactivo
(
  'Reactivar contacto inactivo',
  'Envía un mensaje a contactos que llevan más de 21 días sin ser visitados ni contactados.',
  'engagement',
  '🌡️',
  '{"type": "inactivity", "config": {"days": 21}}',
  '[]',
  '[{"type": "send_whatsapp", "config": {"message": "Hola, {first_name}! 👋\n\nHace tiempo que no hablamos. El equipo de campaña quería saber cómo estás y recordarte que contamos con tu apoyo.", "fallback": "sms", "send_hour_start": 9, "send_hour_end": 18}}]',
  'Hola, María! 👋\n\nHace tiempo que no hablamos. El equipo de campaña quería saber cómo estás y recordarte que contamos con tu apoyo.',
  true,
  3
),

-- 4. Bienvenida a nuevo contacto
(
  'Bienvenida a nuevo contacto',
  'Envía un mensaje de bienvenida cuando se agrega un nuevo contacto al CRM.',
  'engagement',
  '👋',
  '{"type": "contact_created", "config": {}}',
  '[]',
  '[{"type": "send_whatsapp", "config": {"message": "¡Bienvenido, {first_name}! 🤝\n\nGracias por unirte a nuestra campaña. Estamos trabajando por un mejor futuro para {municipio}. ¡Juntos lo lograremos!", "fallback": "sms", "send_hour_start": 8, "send_hour_end": 20}}]',
  '¡Bienvenido, María! 🤝\n\nGracias por unirte a nuestra campaña. Estamos trabajando por un mejor futuro para Rionegro. ¡Juntos lo lograremos!',
  true,
  4
),

-- 5. Celebrar nuevo simpatizante fuerte
(
  'Celebrar nuevo simpatizante fuerte',
  'Cuando un contacto llega a nivel de simpatía 4 o 5, envíale un mensaje de agradecimiento.',
  'sympathy',
  '💪',
  '{"type": "sympathy_change", "config": {"direction": "up", "to_level": 4}}',
  '[]',
  '[{"type": "send_whatsapp", "config": {"message": "¡Hola, {first_name}! 🙌\n\nQueríamos agradecerte por tu apoyo a nuestra campaña. Personas como tú hacen la diferencia. ¡Gracias por creer en nosotros!", "fallback": "skip", "send_hour_start": 9, "send_hour_end": 18}}]',
  '¡Hola, María! 🙌\n\nQueríamos agradecerte por tu apoyo a nuestra campaña. Personas como tú hacen la diferencia. ¡Gracias por creer en nosotros!',
  false,
  5
),

-- 6. Alerta cuando baja simpatía
(
  'Alerta interna cuando baja la simpatía',
  'Notifica al Campaign Manager cuando un contacto baja su nivel de simpatía.',
  'sympathy',
  '⚠️',
  '{"type": "sympathy_change", "config": {"direction": "down"}}',
  '[]',
  '[{"type": "notify_team", "config": {"recipients": "campaign_manager", "message": "Alerta: {full_name} en {barrio} bajó su nivel de simpatía. Se recomienda hacer seguimiento."}}]',
  'Alerta: María García en Cuatro Esquinas bajó su nivel de simpatía. Se recomienda hacer seguimiento.',
  false,
  6
),

-- 7. Seguimiento a donante potencial
(
  'Seguimiento a donante potencial',
  'Cuando en una visita de canvassing el contacto dice que quiere donar, crea una tarea para el equipo.',
  'donations',
  '💰',
  '{"type": "canvass_result", "config": {"result": "wants_to_donate"}}',
  '[]',
  '[{"type": "create_task", "config": {"title": "Llamar a {full_name} — quiere donar", "description": "{full_name} en {barrio} expresó interés en donar durante la visita de canvassing. Contactar hoy.", "assigned_to": "campaign_manager", "due_in_hours": 24}}, {"type": "add_tag", "config": {"tags": ["donante_potencial"]}}]',
  null,
  true,
  7
),

-- 8. Tarea para contacto "Volver más tarde"
(
  'Seguimiento para contacto no encontrado',
  'Crea una tarea de seguimiento cuando el voluntario no encuentra al contacto en casa.',
  'canvassing',
  '🚪',
  '{"type": "canvass_result", "config": {"result": "not_home"}}',
  '[]',
  '[{"type": "create_task", "config": {"title": "Revisitar a {full_name} en {barrio}", "description": "El contacto no estaba en casa durante la visita. Programar una nueva visita.", "assigned_to": "assigned_volunteer", "due_in_hours": 72}}]',
  null,
  false,
  8
),

-- 9. Notificación cuando se detecta donante en canvassing
(
  'Notificación interna — donante detectado',
  'Notifica al Campaign Manager cuando se detecta un donante potencial en canvassing.',
  'canvassing',
  '🔔',
  '{"type": "canvass_result", "config": {"result": "wants_to_donate"}}',
  '[]',
  '[{"type": "notify_team", "config": {"recipients": "campaign_manager", "message": "Nuevo donante potencial: {full_name} en {barrio} ({municipio}). Visitado hoy por un voluntario. ¡Contáctalo pronto!"}}]',
  'Nuevo donante potencial: María García en Cuatro Esquinas (Rionegro). Visitado hoy por un voluntario. ¡Contáctala pronto!',
  false,
  9
),

-- 10. Seguimiento a contacto no contactado 3 veces
(
  'Alerta de zona sin cobertura',
  'Cuando un contacto acumula 3 visitas sin ser encontrado, notifica al coordinador de zona.',
  'canvassing',
  '📍',
  '{"type": "canvass_result", "config": {"result": "not_home", "min_attempts": 3}}',
  '[]',
  '[{"type": "notify_team", "config": {"recipients": "campaign_manager", "message": "Atención: {full_name} en {barrio} lleva 3 visitas sin contacto. Considerar cambiar la estrategia o el horario de visita."}}]',
  'Atención: María García en Cuatro Esquinas lleva 3 visitas sin contacto. Considerar cambiar la estrategia o el horario de visita.',
  false,
  10
);
