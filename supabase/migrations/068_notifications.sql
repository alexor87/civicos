-- 068: Notifications center
-- Tabla de notificaciones in-app para el centro de notificaciones del dashboard

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'new_contact',
    'new_registration',
    'task_completed',
    'flow_triggered',
    'team_mention',
    'system'
  )),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para queries frecuentes
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE read = FALSE;
CREATE INDEX idx_notifications_user_recent ON notifications(user_id, created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Permitir inserts desde service_role (triggers, edge functions, API admin)
CREATE POLICY "notifications_insert_service"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Habilitar realtime para la tabla
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
