-- 038_operations.sql
-- Module: Operations — Tasks and Missions with electoral context
-- Phase 1: Foundation tables, RLS, triggers, views, templates

-- ══════════════════════════════════════════════════════════════
-- ENUMS
-- ══════════════════════════════════════════════════════════════

CREATE TYPE mission_type AS ENUM (
  'canvassing', 'communications', 'event', 'administrative', 'ai_suggested', 'flow_generated'
);

CREATE TYPE task_priority AS ENUM ('urgent', 'high', 'normal', 'low');
CREATE TYPE mission_status AS ENUM ('active', 'completed', 'cancelled', 'on_hold');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'blocked');

-- ══════════════════════════════════════════════════════════════
-- MISSIONS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE missions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id       UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT,
  type              mission_type NOT NULL DEFAULT 'administrative',
  status            mission_status NOT NULL DEFAULT 'active',
  priority          task_priority NOT NULL DEFAULT 'normal',
  owner_id          UUID REFERENCES profiles(id),
  due_date          DATE,
  completed_at      TIMESTAMPTZ,
  created_by        UUID REFERENCES profiles(id),
  source_flow_id    UUID REFERENCES automation_flows(id),
  source_suggestion_id UUID REFERENCES ai_suggestions(id),
  template_key      TEXT,
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_missions_tenant ON missions(tenant_id);
CREATE INDEX idx_missions_campaign ON missions(campaign_id);
CREATE INDEX idx_missions_status ON missions(status);
CREATE INDEX idx_missions_due_date ON missions(due_date);

-- ══════════════════════════════════════════════════════════════
-- TASKS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id       UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  mission_id        UUID REFERENCES missions(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  status            task_status NOT NULL DEFAULT 'pending',
  priority          task_priority NOT NULL DEFAULT 'normal',
  due_date          TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  assignee_id       UUID REFERENCES profiles(id),
  assignee_role_id  UUID REFERENCES custom_roles(id),
  created_by        UUID REFERENCES profiles(id),
  source_flow_id    UUID REFERENCES automation_flows(id),
  source_suggestion_id UUID REFERENCES ai_suggestions(id),
  sort_order        INTEGER NOT NULL DEFAULT 0,
  checklist         JSONB NOT NULL DEFAULT '[]',
  tags              TEXT[] NOT NULL DEFAULT '{}',
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_tenant ON tasks(tenant_id);
CREATE INDEX idx_tasks_campaign ON tasks(campaign_id);
CREATE INDEX idx_tasks_mission ON tasks(mission_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- ══════════════════════════════════════════════════════════════
-- TASK ASSIGNEES (multiple assignees per task)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE task_assignees (
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES profiles(id),
  PRIMARY KEY (task_id, profile_id)
);

CREATE INDEX idx_task_assignees_profile ON task_assignees(profile_id);

-- ══════════════════════════════════════════════════════════════
-- MISSION MEMBERS (team assigned to a mission)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE mission_members (
  mission_id  UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  added_by    UUID REFERENCES profiles(id),
  PRIMARY KEY (mission_id, profile_id)
);

-- ══════════════════════════════════════════════════════════════
-- CONTEXTUAL LINKS (links to platform objects)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE operation_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_type   TEXT NOT NULL CHECK (source_type IN ('task', 'mission')),
  source_id     UUID NOT NULL,
  target_type   TEXT NOT NULL CHECK (target_type IN (
    'contact', 'contact_segment', 'canvass_zone',
    'calendar_event', 'automation_flow', 'campaign'
  )),
  target_id     UUID NOT NULL,
  target_label  TEXT,
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_operation_links_source ON operation_links(source_type, source_id);
CREATE INDEX idx_operation_links_target ON operation_links(target_type, target_id);

-- ══════════════════════════════════════════════════════════════
-- TASK ACTIVITY LOG
-- ══════════════════════════════════════════════════════════════
CREATE TABLE task_activity (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  task_id     UUID REFERENCES tasks(id) ON DELETE CASCADE,
  mission_id  UUID REFERENCES missions(id) ON DELETE CASCADE,
  actor_id    UUID NOT NULL REFERENCES profiles(id),
  action      TEXT NOT NULL,
  payload     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_activity_task ON task_activity(task_id);
CREATE INDEX idx_task_activity_mission ON task_activity(mission_id);
CREATE INDEX idx_task_activity_created ON task_activity(created_at DESC);

-- ══════════════════════════════════════════════════════════════
-- MISSION TEMPLATES
-- ══════════════════════════════════════════════════════════════
CREATE TABLE mission_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  key         TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT,
  type        mission_type NOT NULL,
  icon        TEXT,
  tasks       JSONB NOT NULL DEFAULT '[]',
  is_system   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
-- RLS
-- ══════════════════════════════════════════════════════════════
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_templates ENABLE ROW LEVEL SECURITY;

-- Missions
CREATE POLICY "missions_select" ON missions FOR SELECT
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "missions_insert" ON missions FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id());
CREATE POLICY "missions_update" ON missions FOR UPDATE
  USING (tenant_id = auth_tenant_id() AND (created_by = auth.uid() OR owner_id = auth.uid() OR auth_role() = 'super_admin'));
CREATE POLICY "missions_delete" ON missions FOR DELETE
  USING (tenant_id = auth_tenant_id() AND (created_by = auth.uid() OR auth_role() = 'super_admin'));

-- Tasks
CREATE POLICY "tasks_select" ON tasks FOR SELECT
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "tasks_insert" ON tasks FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id());
CREATE POLICY "tasks_update" ON tasks FOR UPDATE
  USING (tenant_id = auth_tenant_id() AND (assignee_id = auth.uid() OR created_by = auth.uid() OR auth_role() = 'super_admin'));

-- Task Assignees
CREATE POLICY "task_assignees_select" ON task_assignees FOR SELECT
  USING (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_id AND t.tenant_id = auth_tenant_id()));
CREATE POLICY "task_assignees_insert" ON task_assignees FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_id AND t.tenant_id = auth_tenant_id()));
CREATE POLICY "task_assignees_delete" ON task_assignees FOR DELETE
  USING (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_id AND t.tenant_id = auth_tenant_id()));

-- Mission Members
CREATE POLICY "mission_members_select" ON mission_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM missions m WHERE m.id = mission_id AND m.tenant_id = auth_tenant_id()));
CREATE POLICY "mission_members_insert" ON mission_members FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM missions m WHERE m.id = mission_id AND m.tenant_id = auth_tenant_id()));
CREATE POLICY "mission_members_delete" ON mission_members FOR DELETE
  USING (EXISTS (SELECT 1 FROM missions m WHERE m.id = mission_id AND m.tenant_id = auth_tenant_id()));

-- Operation Links
CREATE POLICY "operation_links_select" ON operation_links FOR SELECT
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "operation_links_insert" ON operation_links FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id());
CREATE POLICY "operation_links_delete" ON operation_links FOR DELETE
  USING (tenant_id = auth_tenant_id());

-- Task Activity
CREATE POLICY "task_activity_select" ON task_activity FOR SELECT
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "task_activity_insert" ON task_activity FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id());

-- Mission Templates (system templates readable by all, tenant templates by tenant)
CREATE POLICY "mission_templates_select" ON mission_templates FOR SELECT
  USING (tenant_id IS NULL OR tenant_id = auth_tenant_id());
CREATE POLICY "mission_templates_insert" ON mission_templates FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id());

-- ══════════════════════════════════════════════════════════════
-- TRIGGERS
-- ══════════════════════════════════════════════════════════════
CREATE TRIGGER trg_missions_updated_at
  BEFORE UPDATE ON missions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-log task status changes
CREATE OR REPLACE FUNCTION log_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO task_activity (tenant_id, task_id, mission_id, actor_id, action, payload)
    VALUES (
      NEW.tenant_id,
      NEW.id,
      NEW.mission_id,
      COALESCE(auth.uid(), NEW.created_by),
      'status_changed',
      jsonb_build_object('from', OLD.status::text, 'to', NEW.status::text)
    );
    IF NEW.status = 'completed' THEN
      NEW.completed_at = now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_task_status_change
  BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION log_task_status_change();

-- ══════════════════════════════════════════════════════════════
-- VIEW: Mission progress
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW mission_progress AS
SELECT
  m.id AS mission_id,
  m.tenant_id,
  COUNT(t.id) AS total_tasks,
  COUNT(t.id) FILTER (WHERE t.status = 'completed') AS completed_tasks,
  CASE
    WHEN COUNT(t.id) = 0 THEN 0
    ELSE ROUND(COUNT(t.id) FILTER (WHERE t.status = 'completed')::NUMERIC / COUNT(t.id) * 100)
  END AS progress_pct
FROM missions m
LEFT JOIN tasks t ON t.mission_id = m.id AND t.status != 'cancelled'
GROUP BY m.id, m.tenant_id;

-- ══════════════════════════════════════════════════════════════
-- SEED: System mission templates
-- ══════════════════════════════════════════════════════════════
INSERT INTO mission_templates (key, name, description, type, icon, is_system, tasks) VALUES
(
  'debate_prep',
  'Preparación para debate electoral',
  'Todo lo necesario para preparar al candidato y al equipo para un debate',
  'event',
  '🎙',
  true,
  '[
    {"title": "Definir ejes temáticos del debate", "assignee_role_key": "campaign_manager", "days_before_due": 7},
    {"title": "Redactar argumentarios por tema", "assignee_role_key": "campaign_manager", "days_before_due": 5},
    {"title": "Preparar respuestas a preguntas difíciles", "assignee_role_key": "campaign_manager", "days_before_due": 4},
    {"title": "Ensayo 1 con el candidato", "assignee_role_key": "campaign_manager", "days_before_due": 3},
    {"title": "Ensayo 2 con el candidato", "assignee_role_key": "campaign_manager", "days_before_due": 1},
    {"title": "Coordinar transporte y logística", "assignee_role_key": "field_coordinator", "days_before_due": 2},
    {"title": "Preparar materiales visuales", "assignee_role_key": "campaign_manager", "days_before_due": 2},
    {"title": "Briefing final al equipo", "assignee_role_key": "campaign_manager", "days_before_due": 0}
  ]'
),
(
  'canvassing_zone',
  'Jornada de canvassing en zona nueva',
  'Organizar una jornada completa de canvassing en una zona sin cobertura',
  'canvassing',
  '🗺',
  true,
  '[
    {"title": "Identificar contactos indecisos en la zona", "assignee_role_key": "analyst", "days_before_due": 5},
    {"title": "Asignar casas a cada voluntario", "assignee_role_key": "field_coordinator", "days_before_due": 3},
    {"title": "Briefing a voluntarios", "assignee_role_key": "field_coordinator", "days_before_due": 1},
    {"title": "Jornada de canvassing", "assignee_role_key": "volunteer", "days_before_due": 0},
    {"title": "Aprobar registros de visita", "assignee_role_key": "field_coordinator", "days_before_due": 0},
    {"title": "Actualizar estados de simpatía en CRM", "assignee_role_key": "analyst", "days_before_due": 0},
    {"title": "Reporte de cobertura", "assignee_role_key": "field_coordinator", "days_before_due": 0}
  ]'
),
(
  'campaign_closing',
  'Cierre de campaña — semana final',
  'Checklist completo para la semana final antes de las elecciones',
  'event',
  '🏁',
  true,
  '[
    {"title": "Confirmar asistencia de voluntarios al cierre", "assignee_role_key": "field_coordinator", "days_before_due": 7},
    {"title": "Material de cierre impreso (pasacalles, volantes)", "assignee_role_key": "campaign_manager", "days_before_due": 5},
    {"title": "Plan de movilización del día de la elección", "assignee_role_key": "campaign_manager", "days_before_due": 4},
    {"title": "Lista de testigos de mesa confirmados", "assignee_role_key": "field_coordinator", "days_before_due": 3},
    {"title": "Comunicación final a simpatizantes", "assignee_role_key": "campaign_manager", "days_before_due": 2},
    {"title": "Protocolo de sala de situación", "assignee_role_key": "campaign_manager", "days_before_due": 1}
  ]'
);
