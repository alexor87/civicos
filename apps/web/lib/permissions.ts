// ── Permission System for CivicOS RBAC ──────────────────────────────────────

export type Permission =
  | 'contacts.view'
  | 'contacts.create'
  | 'contacts.edit'
  | 'contacts.delete'
  | 'contacts.export'
  | 'contacts.import'
  | 'contacts.view_political_profile'
  | 'contacts.edit_political_profile'
  | 'contacts.view_strategic_fields'
  | 'territory.view'
  | 'territory.manage'
  | 'canvassing.view'
  | 'canvassing.register_visits'
  | 'canvassing.approve_visits'
  | 'canvassing.assign_zones'
  | 'communications.view'
  | 'communications.create'
  | 'communications.send'
  | 'communications.view_metrics'
  | 'flows.view'
  | 'flows.create'
  | 'flows.activate'
  | 'flows.delete'
  | 'reports.view'
  | 'reports.export'
  | 'ai_agents.view'
  | 'ai_agents.interact'
  | 'ai_agents.approve'
  | 'knowledge_base.view'
  | 'knowledge_base.manage'
  | 'content_ia.view'
  | 'content_ia.generate'
  | 'team.view'
  | 'team.invite'
  | 'team.manage_roles'
  | 'team.deactivate'
  | 'settings.campaign'
  | 'settings.integrations'
  | 'settings.brand'
  | 'settings.geo'
  | 'settings.api'
  | 'roles.manage'
  | 'calendar.view'
  | 'calendar.create_events'
  | 'calendar.manage_events'
  | 'volunteers.view'
  | 'volunteers.manage'

export const ALL_PERMISSIONS: Permission[] = [
  'contacts.view',
  'contacts.create',
  'contacts.edit',
  'contacts.delete',
  'contacts.export',
  'contacts.import',
  'contacts.view_political_profile',
  'contacts.edit_political_profile',
  'contacts.view_strategic_fields',
  'territory.view',
  'territory.manage',
  'canvassing.view',
  'canvassing.register_visits',
  'canvassing.approve_visits',
  'canvassing.assign_zones',
  'communications.view',
  'communications.create',
  'communications.send',
  'communications.view_metrics',
  'flows.view',
  'flows.create',
  'flows.activate',
  'flows.delete',
  'reports.view',
  'reports.export',
  'ai_agents.view',
  'ai_agents.interact',
  'ai_agents.approve',
  'knowledge_base.view',
  'knowledge_base.manage',
  'content_ia.view',
  'content_ia.generate',
  'team.view',
  'team.invite',
  'team.manage_roles',
  'team.deactivate',
  'settings.campaign',
  'settings.integrations',
  'settings.brand',
  'settings.geo',
  'settings.api',
  'roles.manage',
  'calendar.view',
  'calendar.create_events',
  'calendar.manage_events',
  'volunteers.view',
  'volunteers.manage',
]

// ── Permission metadata ─────────────────────────────────────────────────────

export type PermissionMeta = {
  key: Permission
  label: string
  description: string
}

export type PermissionModule = {
  name: string
  key: string
  permissions: PermissionMeta[]
}

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    name: 'Contactos',
    key: 'contacts',
    permissions: [
      { key: 'contacts.view', label: 'Ver contactos', description: 'Acceder al módulo de Contactos y ver la lista' },
      { key: 'contacts.create', label: 'Crear contactos', description: 'Añadir nuevos contactos al CRM' },
      { key: 'contacts.edit', label: 'Editar contactos', description: 'Modificar datos de contactos existentes' },
      { key: 'contacts.delete', label: 'Eliminar contactos', description: 'Borrar contactos del CRM' },
      { key: 'contacts.export', label: 'Exportar contactos', description: 'Descargar la base de datos en CSV' },
      { key: 'contacts.import', label: 'Importar contactos', description: 'Cargar contactos desde archivo CSV' },
      { key: 'contacts.view_political_profile', label: 'Ver perfil político', description: 'Ver afinidad, intención de voto y datos electorales' },
      { key: 'contacts.edit_political_profile', label: 'Editar perfil político', description: 'Modificar afinidad e intención de voto' },
      { key: 'contacts.view_strategic_fields', label: 'Ver campos estratégicos', description: 'Ver \'Votos que moviliza\', líder referente, etc.' },
    ],
  },
  {
    name: 'Territorio y Canvassing',
    key: 'territory_canvassing',
    permissions: [
      { key: 'territory.view', label: 'Ver territorios', description: 'Acceder al mapa de zonas y territorios' },
      { key: 'territory.manage', label: 'Gestionar territorios', description: 'Crear, editar y asignar zonas' },
      { key: 'canvassing.view', label: 'Ver canvassing', description: 'Ver el listado de visitas y el mapa del equipo' },
      { key: 'canvassing.register_visits', label: 'Registrar visitas', description: 'Crear nuevos registros de visita' },
      { key: 'canvassing.approve_visits', label: 'Aprobar visitas', description: 'Validar o rechazar los registros del equipo' },
      { key: 'canvassing.assign_zones', label: 'Asignar zonas', description: 'Reasignar territorios entre voluntarios' },
    ],
  },
  {
    name: 'Comunicaciones',
    key: 'communications',
    permissions: [
      { key: 'communications.view', label: 'Ver comunicaciones', description: 'Acceder al módulo de comunicaciones' },
      { key: 'communications.create', label: 'Crear comunicaciones', description: 'Redactar nuevas campañas de email o SMS' },
      { key: 'communications.send', label: 'Enviar comunicaciones', description: 'Enviar o programar el envío' },
      { key: 'communications.view_metrics', label: 'Ver métricas', description: 'Acceder a tasas de apertura, clics, etc.' },
    ],
  },
  {
    name: 'Automatizaciones',
    key: 'flows',
    permissions: [
      { key: 'flows.view', label: 'Ver automatizaciones', description: 'Acceder al módulo de Flows' },
      { key: 'flows.create', label: 'Crear automatizaciones', description: 'Construir nuevos Flows' },
      { key: 'flows.activate', label: 'Activar automatizaciones', description: 'Encender o apagar Flows existentes' },
      { key: 'flows.delete', label: 'Eliminar automatizaciones', description: 'Borrar Flows' },
    ],
  },
  {
    name: 'Reportes e Inteligencia',
    key: 'reports_intelligence',
    permissions: [
      { key: 'reports.view', label: 'Ver reportes', description: 'Acceder al módulo de Reportes' },
      { key: 'reports.export', label: 'Exportar reportes', description: 'Descargar reportes en PDF o CSV' },
      { key: 'ai_agents.view', label: 'Ver agentes IA', description: 'Ver la actividad de los agentes IA' },
      { key: 'ai_agents.interact', label: 'Interactuar con IA', description: 'Hacer preguntas y recibir sugerencias' },
      { key: 'ai_agents.approve', label: 'Aprobar sugerencias IA', description: 'Aceptar o rechazar sugerencias de los agentes' },
      { key: 'knowledge_base.view', label: 'Ver base de conocimiento', description: 'Acceder a la base de conocimiento' },
      { key: 'knowledge_base.manage', label: 'Gestionar base de conocimiento', description: 'Agregar y editar documentos' },
      { key: 'content_ia.view', label: 'Ver contenido IA', description: 'Acceder al módulo de Contenido IA' },
      { key: 'content_ia.generate', label: 'Generar contenido IA', description: 'Solicitar generación de contenido' },
    ],
  },
  {
    name: 'Equipo y Configuración',
    key: 'team_settings',
    permissions: [
      { key: 'team.view', label: 'Ver equipo', description: 'Ver la lista de miembros del equipo' },
      { key: 'team.invite', label: 'Invitar miembros', description: 'Enviar invitaciones a nuevos miembros' },
      { key: 'team.manage_roles', label: 'Gestionar roles', description: 'Cambiar el rol de los miembros' },
      { key: 'team.deactivate', label: 'Desactivar miembros', description: 'Suspender el acceso de un miembro' },
      { key: 'settings.campaign', label: 'Configuración de campaña', description: 'Editar el perfil y temas de la campaña' },
      { key: 'settings.integrations', label: 'Configuración de integraciones', description: 'Gestionar Twilio, Resend y Claude' },
      { key: 'settings.brand', label: 'Marca e identidad', description: 'Editar logo, colores y eslogan' },
      { key: 'settings.geo', label: 'Base geográfica', description: 'Gestionar datos geográficos' },
      { key: 'settings.api', label: 'API y claves', description: 'Gestionar API keys' },
      { key: 'roles.manage', label: 'Gestionar roles y permisos', description: 'Crear y editar roles (solo Super Admin)' },
    ],
  },
  {
    name: 'Calendario',
    key: 'calendar',
    permissions: [
      { key: 'calendar.view', label: 'Ver calendario', description: 'Acceder al módulo de Calendario' },
      { key: 'calendar.create_events', label: 'Crear eventos', description: 'Añadir eventos al calendario' },
      { key: 'calendar.manage_events', label: 'Gestionar eventos', description: 'Editar y eliminar cualquier evento' },
    ],
  },
  {
    name: 'Voluntarios',
    key: 'volunteers',
    permissions: [
      { key: 'volunteers.view', label: 'Ver voluntarios', description: 'Acceder al módulo de Voluntarios' },
      { key: 'volunteers.manage', label: 'Gestionar voluntarios', description: 'Editar asignaciones y datos de voluntarios' },
    ],
  },
]

// ── Default permission matrices per role ─────────────────────────────────────

function allTrue(): Record<Permission, boolean> {
  const map = {} as Record<Permission, boolean>
  ALL_PERMISSIONS.forEach(p => { map[p] = true })
  return map
}

function allFalse(): Record<Permission, boolean> {
  const map = {} as Record<Permission, boolean>
  ALL_PERMISSIONS.forEach(p => { map[p] = false })
  return map
}

function withTrue(keys: Permission[]): Record<Permission, boolean> {
  const map = allFalse()
  keys.forEach(k => { map[k] = true })
  return map
}

function allTrueExcept(keys: Permission[]): Record<Permission, boolean> {
  const map = allTrue()
  keys.forEach(k => { map[k] = false })
  return map
}

export const DEFAULT_PERMISSIONS: Record<string, Record<Permission, boolean>> = {
  super_admin: allTrue(),

  campaign_manager: allTrueExcept([
    'team.deactivate',
    'settings.integrations',
    'settings.geo',
    'settings.api',
    'roles.manage',
  ]),

  field_coordinator: withTrue([
    'contacts.view',
    'contacts.create',
    'contacts.edit',
    'contacts.view_political_profile',
    'contacts.edit_political_profile',
    'territory.view',
    'territory.manage',
    'canvassing.view',
    'canvassing.register_visits',
    'canvassing.approve_visits',
    'canvassing.assign_zones',
    'knowledge_base.view',
    'team.view',
    'calendar.view',
    'calendar.create_events',
    'volunteers.view',
    'volunteers.manage',
  ]),

  volunteer: withTrue([
    'contacts.view',
    'contacts.create',
    'territory.view',
    'canvassing.view',
    'canvassing.register_visits',
    'calendar.view',
  ]),

  analyst: withTrue([
    'contacts.view',
    'contacts.export',
    'contacts.view_political_profile',
    'contacts.view_strategic_fields',
    'territory.view',
    'canvassing.view',
    'communications.view',
    'communications.view_metrics',
    'reports.view',
    'reports.export',
    'ai_agents.view',
    'ai_agents.interact',
    'knowledge_base.view',
    'calendar.view',
    'volunteers.view',
  ]),
}

// ── Permission dependencies ─────────────────────────────────────────────────

export const PERMISSION_DEPENDENCIES: Partial<Record<Permission, Permission[]>> = {
  'contacts.create': ['contacts.view'],
  'contacts.edit': ['contacts.view'],
  'contacts.delete': ['contacts.edit', 'contacts.view'],
  'contacts.export': ['contacts.view'],
  'contacts.import': ['contacts.view'],
  'contacts.view_political_profile': ['contacts.view'],
  'contacts.edit_political_profile': ['contacts.view_political_profile', 'contacts.view'],
  'contacts.view_strategic_fields': ['contacts.view'],
  'territory.manage': ['territory.view'],
  'canvassing.register_visits': ['canvassing.view'],
  'canvassing.approve_visits': ['canvassing.view'],
  'canvassing.assign_zones': ['canvassing.view'],
  'communications.create': ['communications.view'],
  'communications.send': ['communications.create', 'communications.view'],
  'communications.view_metrics': ['communications.view'],
  'flows.create': ['flows.view'],
  'flows.activate': ['flows.view'],
  'flows.delete': ['flows.view'],
  'reports.export': ['reports.view'],
  'ai_agents.interact': ['ai_agents.view'],
  'ai_agents.approve': ['ai_agents.view'],
  'knowledge_base.manage': ['knowledge_base.view'],
  'content_ia.generate': ['content_ia.view'],
  'team.invite': ['team.view'],
  'team.manage_roles': ['team.view'],
  'team.deactivate': ['team.view'],
  'calendar.create_events': ['calendar.view'],
  'calendar.manage_events': ['calendar.view'],
  'volunteers.manage': ['volunteers.view'],
}
