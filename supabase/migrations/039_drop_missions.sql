-- 039_drop_missions.sql
-- Remove mission functionality — operations module now only has tasks

-- ══════════════════════════════════════════════════════════════
-- Drop views that depend on missions
-- ══════════════════════════════════════════════════════════════
DROP VIEW IF EXISTS mission_progress;

-- ══════════════════════════════════════════════════════════════
-- Drop mission-related triggers
-- ══════════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS trg_missions_updated_at ON missions;

-- ══════════════════════════════════════════════════════════════
-- Remove mission_id FK from tasks
-- ══════════════════════════════════════════════════════════════
DROP INDEX IF EXISTS idx_tasks_mission;
ALTER TABLE tasks DROP COLUMN IF EXISTS mission_id;

-- ══════════════════════════════════════════════════════════════
-- Remove mission_id from task_activity
-- ══════════════════════════════════════════════════════════════
DROP INDEX IF EXISTS idx_task_activity_mission;
ALTER TABLE task_activity DROP COLUMN IF EXISTS mission_id;

-- Update the log_task_status_change function to remove mission_id reference
CREATE OR REPLACE FUNCTION log_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO task_activity (tenant_id, task_id, actor_id, action, payload)
    VALUES (
      NEW.tenant_id,
      NEW.id,
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

-- ══════════════════════════════════════════════════════════════
-- Update operation_links to remove 'mission' source type
-- ══════════════════════════════════════════════════════════════
DELETE FROM operation_links WHERE source_type = 'mission';
ALTER TABLE operation_links DROP CONSTRAINT IF EXISTS operation_links_source_type_check;
ALTER TABLE operation_links ADD CONSTRAINT operation_links_source_type_check
  CHECK (source_type IN ('task'));

-- ══════════════════════════════════════════════════════════════
-- Drop mission tables (order matters for FK dependencies)
-- ══════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS mission_templates CASCADE;
DROP TABLE IF EXISTS mission_members CASCADE;
DROP TABLE IF EXISTS missions CASCADE;

-- ══════════════════════════════════════════════════════════════
-- Drop mission-related enums
-- ══════════════════════════════════════════════════════════════
DROP TYPE IF EXISTS mission_type;
DROP TYPE IF EXISTS mission_status;
