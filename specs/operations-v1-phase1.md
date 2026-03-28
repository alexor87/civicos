# Operaciones — Fase 1: Fundación

**Fecha:** 2026-03-28
**Estado:** Aprobada
**Autor:** CTO (Claude)
**Aprobado por:** PM (Usuario)

---

## Problema / Necesidad

Scrutix tiene estrategia (Flows, IA), datos (CRM, Reportes) y comunicaciones. Pero no hay un lugar donde el equipo vea qué tiene que hacer hoy, quién lo hace, y si se completó. Las tareas viven en WhatsApp, Excel y papel. Esto genera falta de trazabilidad, duplicación de esfuerzos y zero accountability.

## Solución propuesta

Módulo "Operaciones" con gestión de **Misiones** (agrupaciones tácticas) y **Tareas** (acciones individuales) integradas nativamente con el contexto electoral de Scrutix. Acceso controlado por 6 permisos dinámicos. Tres vistas: Resumen (home), Tablero (Kanban) y Lista.

## Requisitos funcionales

- [ ] RF-1: Migración DB con tablas missions, tasks, task_assignees, mission_members, operation_links, task_activity, mission_templates + RLS + triggers + vista mission_progress
- [ ] RF-2: 6 permisos nuevos integrados al sistema de roles dinámicos
- [ ] RF-3: Item "Operaciones" en sidebar (entre Voluntarios y Territorio) controlado por `operations.view`
- [ ] RF-4: Vista Resumen con KPIs adaptativos, misiones activas (max 5) y "Mis tareas para hoy"
- [ ] RF-5: Vista Tablero Kanban con 3 columnas (Pendiente, En progreso, Completado) y filtros
- [ ] RF-6: Vista Lista agrupable (por misión, responsable, prioridad, sin agrupar)
- [ ] RF-7: CRUD de Misiones (crear, ver detalle, editar inline, eliminar)
- [ ] RF-8: CRUD de Tareas (crear rápido inline + modal completo, detalle en drawer, cambiar estado con checkbox, editar)
- [ ] RF-9: Crear misión desde plantilla del sistema (3 plantillas seed)
- [ ] RF-10: Tabs de navegación entre vistas (Resumen / Tablero / Lista)
- [ ] RF-11: Detalle de misión con lista de tareas agrupadas por estado + barra de progreso
- [ ] RF-12: Detalle de tarea en drawer lateral (checklist interno, prioridad, estado, responsable, fecha)

## Diseño técnico

### Archivos a crear

| Archivo | Propósito |
|---------|-----------|
| `supabase/migrations/038_operations.sql` | Modelo de datos completo |
| `apps/web/app/dashboard/operations/page.tsx` | Vista Resumen (server) |
| `apps/web/app/dashboard/operations/board/page.tsx` | Vista Tablero (server) |
| `apps/web/app/dashboard/operations/list/page.tsx` | Vista Lista (server) |
| `apps/web/app/dashboard/operations/missions/[id]/page.tsx` | Detalle de misión (server) |
| `apps/web/app/dashboard/operations/layout.tsx` | Layout con tabs de navegación |
| `apps/web/app/api/operations/missions/route.ts` | GET list + POST create |
| `apps/web/app/api/operations/missions/[id]/route.ts` | GET + PATCH + DELETE |
| `apps/web/app/api/operations/tasks/route.ts` | GET list + POST create |
| `apps/web/app/api/operations/tasks/[id]/route.ts` | GET + PATCH + DELETE |
| `apps/web/components/operations/OperationsHome.tsx` | Client: KPIs + misiones + tareas hoy |
| `apps/web/components/operations/KanbanBoard.tsx` | Client: tablero 3 columnas |
| `apps/web/components/operations/TaskListView.tsx` | Client: tabla con agrupación |
| `apps/web/components/operations/MissionDetail.tsx` | Client: detalle de misión |
| `apps/web/components/operations/TaskDrawer.tsx` | Client: drawer lateral de tarea |
| `apps/web/components/operations/CreateTaskModal.tsx` | Client: modal nueva tarea |
| `apps/web/components/operations/CreateMissionModal.tsx` | Client: modal nueva misión |
| `apps/web/components/operations/OperationsTabs.tsx` | Client: tabs Resumen/Tablero/Lista |
| `apps/web/__tests__/api/operations/missions-api.test.ts` | Tests API misiones |
| `apps/web/__tests__/api/operations/tasks-api.test.ts` | Tests API tareas |
| `apps/web/__tests__/operations/permissions.test.ts` | Tests permisos operaciones |

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `apps/web/lib/permissions.ts` | 6 permisos nuevos en type, ALL_PERMISSIONS, PERMISSION_MODULES, DEFAULT_PERMISSIONS, PERMISSION_DEPENDENCIES |
| `apps/web/components/dashboard/Sidebar.tsx` | Nuevo grupo nav "Operaciones" con icono ClipboardList |

### API / Data model

#### Migración 038_operations.sql

**ENUMs:**
- `mission_type`: canvassing, communications, event, administrative, ai_suggested, flow_generated
- `task_priority`: urgent, high, normal, low
- `mission_status`: active, completed, cancelled, on_hold
- `task_status`: pending, in_progress, completed, cancelled, blocked

**Tablas principales:**

```sql
-- missions: agrupación táctica de tareas
CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type mission_type NOT NULL DEFAULT 'administrative',
  status mission_status NOT NULL DEFAULT 'active',
  priority task_priority NOT NULL DEFAULT 'normal',
  owner_id UUID REFERENCES profiles(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  source_flow_id UUID REFERENCES automation_flows(id),
  source_suggestion_id UUID REFERENCES ai_suggestions(id),
  template_key TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- tasks: unidad mínima de acción
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'pending',
  priority task_priority NOT NULL DEFAULT 'normal',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  assignee_id UUID REFERENCES profiles(id),
  assignee_role_id UUID REFERENCES custom_roles(id),
  created_by UUID REFERENCES profiles(id),
  source_flow_id UUID REFERENCES automation_flows(id),
  source_suggestion_id UUID REFERENCES ai_suggestions(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  checklist JSONB NOT NULL DEFAULT '[]',
  tags TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Tablas de relación:** task_assignees, mission_members, operation_links, task_activity, mission_templates (ver PRD sección 17 para DDL completo).

**Vista:** `mission_progress` (calcula total_tasks, completed_tasks, progress_pct por misión).

**RLS:** Todas las tablas con tenant isolation vía `auth_tenant_id()`. SELECT para todo el tenant, INSERT para todo el tenant, UPDATE restringido a creator/assignee/super_admin.

**Triggers:** `update_updated_at()` en missions y tasks. `log_task_status_change()` registra cambios de estado en task_activity.

#### API Endpoints

**GET /api/operations/missions**
Query params: `campaign_id`, `status` (optional filter)
Returns: missions con progress (join a mission_progress view)

**POST /api/operations/missions**
Body: `{ name, description, type, priority, due_date, template_key? }`
Requiere: `operations.create_missions`

**GET /api/operations/missions/[id]**
Returns: mission + tasks + members + progress

**PATCH /api/operations/missions/[id]**
Body: partial mission fields
Requiere: creator/owner OR `operations.manage_all`

**DELETE /api/operations/missions/[id]**
Requiere: creator OR `operations.manage_all`

**GET /api/operations/tasks**
Query params: `campaign_id`, `mission_id?`, `status?`, `assignee_id?`, `due_date?`
Returns: tasks con assignee profile info

**POST /api/operations/tasks**
Body: `{ title, mission_id?, assignee_id?, due_date?, priority, description? }`
Requiere: `operations.create_tasks`

**PATCH /api/operations/tasks/[id]**
Body: partial task fields (status, title, description, due_date, priority, checklist, assignee_id)
Requiere: assignee/creator OR `operations.manage_all`

**DELETE /api/operations/tasks/[id]**
Requiere: creator OR `operations.manage_all`

#### Permisos nuevos

```typescript
// Agregados a Permission type y ALL_PERMISSIONS
'operations.view'
'operations.create_tasks'
'operations.create_missions'
'operations.assign_any'
'operations.assign_team'
'operations.manage_all'

// PERMISSION_MODULES: nuevo módulo
{
  name: 'Operaciones',
  key: 'operations',
  permissions: [
    { key: 'operations.view', label: 'Ver operaciones', description: 'Acceder al módulo de Operaciones' },
    { key: 'operations.create_tasks', label: 'Crear tareas', description: 'Crear nuevas tareas' },
    { key: 'operations.create_missions', label: 'Crear misiones', description: 'Crear y editar misiones' },
    { key: 'operations.assign_any', label: 'Asignar a cualquiera', description: 'Asignar tareas a cualquier miembro del tenant' },
    { key: 'operations.assign_team', label: 'Asignar al equipo', description: 'Asignar tareas a miembros de su equipo' },
    { key: 'operations.manage_all', label: 'Gestionar todo', description: 'Editar y eliminar cualquier tarea o misión' },
  ],
}

// DEFAULT_PERMISSIONS updates:
// super_admin: all 6 = true (ya tiene allTrue())
// campaign_manager: all 6 = true (allTrueExcept no excluye operations)
// field_coordinator: +operations.view, +operations.create_tasks, +operations.create_missions, +operations.assign_team
// volunteer: +operations.view, +operations.create_tasks
// analyst: +operations.view

// PERMISSION_DEPENDENCIES:
'operations.create_tasks': ['operations.view'],
'operations.create_missions': ['operations.view'],
'operations.assign_any': ['operations.create_tasks'],
'operations.assign_team': ['operations.create_tasks'],
'operations.manage_all': ['operations.view'],
```

## Edge cases

| Caso | Comportamiento esperado |
|------|------------------------|
| Misión sin tareas | Progreso = 0%, barra vacía, texto "Sin tareas aún" |
| Tarea sin misión | Se muestra en vista general, columna "Misión" dice "—" |
| Tarea vencida | Badge rojo "Vencida", aparece primero en "Mis tareas hoy" |
| Usuario sin `operations.view` | Sidebar no muestra "Operaciones", URL directa = Access Denied |
| Completar tarea con checklist pendiente | Tooltip: "Esta tarea tiene N ítems sin completar. ¿Marcar todo?" |
| Eliminar misión con tareas | Las tareas quedan huérfanas (mission_id = NULL via ON DELETE SET NULL) |
| Crear misión desde plantilla | Pre-llena nombre, descripción, tipo y tareas sugeridas (sin responsables ni fechas) |
| Misión 100% completa | Aparece botón "Completar misión" en el detalle |

## Criterios de aceptación

- [ ] CA-1: Migración 038 ejecuta sin errores y crea todas las tablas/índices/triggers/RLS
- [ ] CA-2: 6 permisos aparecen en la pantalla de Roles y Permisos
- [ ] CA-3: "Operaciones" aparece en sidebar solo para usuarios con `operations.view`
- [ ] CA-4: Vista Resumen muestra KPIs correctos, misiones activas y tareas del día
- [ ] CA-5: Se puede crear una misión (manual y desde plantilla) y aparece en la lista
- [ ] CA-6: Se puede crear una tarea (inline y modal) con responsable, fecha y prioridad
- [ ] CA-7: Tablero Kanban muestra tareas en 3 columnas con filtros funcionales
- [ ] CA-8: Vista Lista agrupa por misión/responsable/prioridad correctamente
- [ ] CA-9: Cambiar estado de tarea con checkbox actualiza el estado en DB
- [ ] CA-10: Detalle de misión muestra progreso, equipo y lista de tareas
- [ ] CA-11: Detalle de tarea en drawer permite editar todos los campos
- [ ] CA-12: Todos los tests pasan (`pnpm test`)
- [ ] CA-13: Deploy exitoso a producción

## Out of scope (Fase 2+)

- Drag & drop entre columnas del Kanban
- Vínculos contextuales UI (tabla creada pero sin frontend)
- Comentarios en tareas
- Adjuntos / archivos
- Actividad reciente del equipo (feed)
- Integración bidireccional con Flows, Calendario, CRM, Canvassing
- Acciones en bloque (reasignar, cambiar estado masivo)
- Notificaciones push
- Módulo mobile
- Asignación por rol completo (crear tarea por cada miembro)
- Sugerencias IA en Operaciones

## Notas

- Patrón de API: usar `createAdminClient()` de `lib/supabase/admin.ts` para mutaciones (bypasa RLS). Validar permisos server-side antes de mutar.
- Patrón de páginas: server component fetches data, passes to client component. Usar `Promise.all()` para queries paralelos.
- Componentes UI: shadcn/ui exclusivamente. Tremor para gráficos de KPI si aplica.
- La tabla `operation_links` se crea en esta fase para no requerir migración futura, pero la UI de vínculos es Fase 2.
- La tabla `mission_templates` se crea con seed de 3 plantillas del sistema.
- `task_priority` ENUM se reutiliza entre missions y tasks (mismo tipo).
