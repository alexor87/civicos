-- ============================================================
-- Migration 029: CivicOS Flows Fase 2 — 15 nuevas plantillas
-- Agrega plantillas que usan los nuevos tipos de acción y trigger
-- de Flows Fase 2: send_sms, send_email, change_sympathy,
-- create_calendar_event, wait, contact_replied, calendar_date
-- ============================================================

INSERT INTO flow_templates (name, description, category, icon, trigger_config, filter_config, actions_config, preview_message, is_featured, sort_order) VALUES

-- 11. Aniversario como voluntario
(
  'Aniversario como voluntario',
  'Felicita a los voluntarios en el aniversario de cuando se unieron al equipo.',
  'birthday',
  '🌟',
  '{"type": "date_field", "config": {"field": "became_volunteer_at", "offset_days": 0, "time": "09:00"}}',
  '[]',
  '[{"type": "send_whatsapp", "config": {"message": "¡Hola {first_name}! 🌟\n\nHoy se cumple un año desde que te uniste al equipo de campaña.\n\n¡Gracias por todo tu compromiso y esfuerzo! El candidato está muy orgulloso de tenerte en el equipo.", "fallback": "sms", "send_hour_start": 8, "send_hour_end": 20}}]',
  '¡Hola María! 🌟\n\nHoy se cumple un año desde que te uniste al equipo de campaña.\n\n¡Gracias por todo tu compromiso y esfuerzo!',
  false,
  11
),

-- 12. Aviso coordinador 3 días antes del cumpleaños
(
  'Aviso al coordinador — 3 días antes del cumpleaños',
  'Crea una tarea para el coordinador de zona para que prepare un mensaje personalizado antes del cumpleaños.',
  'birthday',
  '📋',
  '{"type": "date_field", "config": {"field": "birth_date", "offset_days": -3, "time": "08:00"}}',
  '[]',
  '[{"type": "create_task", "config": {"title": "Preparar felicitación de cumpleaños para {first_name}", "description": "El cumpleaños de este contacto es en 3 días. Prepara un mensaje personalizado.", "assigned_to": "zone_coordinator", "due_in_hours": 48}}]',
  null,
  false,
  12
),

-- 13. Email de bienvenida al nuevo contacto
(
  'Email de bienvenida al nuevo contacto',
  'Envía un email de bienvenida cuando se agrega un nuevo contacto al CRM.',
  'engagement',
  '✉️',
  '{"type": "contact_created", "config": {}}',
  '[]',
  '[{"type": "send_email", "config": {"subject": "Bienvenido/a a la campaña, {first_name}", "body": "Hola {first_name},\n\nQueremos darte la bienvenida a nuestra campaña. Estamos muy contentos de que hayas decidido unirte a nosotros.\n\nTu participación es fundamental para el éxito de este proyecto.\n\nCon todo nuestro apoyo,\n{candidate_name}"}}]',
  'Hola María,\n\nQueremos darte la bienvenida a nuestra campaña...',
  true,
  13
),

-- 14. SMS de reactivación — inactivo 14 días
(
  'SMS de reactivación — inactivo 14 días',
  'Envía un SMS corto a contactos que llevan 14 días sin ser visitados para reactivar el contacto.',
  'engagement',
  '📱',
  '{"type": "inactivity", "config": {"days": 14}}',
  '[]',
  '[{"type": "send_sms", "config": {"message": "Hola {first_name}, te extrañamos en la campaña. ¿Podemos contactarte esta semana? Responde SÍ y un voluntario te llamará."}}]',
  'Hola María, te extrañamos en la campaña. ¿Podemos contactarte esta semana?',
  true,
  14
),

-- 15. Esperar 2 días y enviar WhatsApp de seguimiento
(
  'Seguimiento 2 días después del primer contacto',
  'Espera 2 días después de que se crea el contacto y luego envía un mensaje de seguimiento.',
  'engagement',
  '⏳',
  '{"type": "contact_created", "config": {}}',
  '[]',
  '[{"type": "wait", "config": {"days": 2}}, {"type": "send_whatsapp", "config": {"message": "Hola {first_name}, hace un par de días nos diste tus datos y quería saber si tienes alguna pregunta sobre nuestra campaña. ¿Puedo ayudarte con algo?", "fallback": "sms"}}]',
  'Hola María, hace un par de días nos diste tus datos...',
  false,
  15
),

-- 16. Convertir simpatizante fuerte en voluntario potencial
(
  'Celebrar cuando alguien llega al nivel 5 de simpatía',
  'Envía un WhatsApp especial y agrega el tag "voluntario_potencial" cuando un contacto alcanza el nivel máximo de simpatía.',
  'sympathy',
  '⭐',
  '{"type": "sympathy_change", "config": {"direction": "up", "to_level": 5}}',
  '[]',
  '[{"type": "send_whatsapp", "config": {"message": "¡{first_name}! Sabemos que eres uno de nuestros mayores simpatizantes y queremos agradecerte personalmente. ¿Te gustaría unirte a nuestro equipo de voluntarios?", "fallback": "sms"}}, {"type": "add_tag", "config": {"tags": ["voluntario_potencial", "simpatizante_fuerte"]}}]',
  '¡María! Sabemos que eres una de nuestras mayores simpatizantes...',
  true,
  16
),

-- 17. Bajar tag al detectar caída de simpatía
(
  'Alerta interna por caída de simpatía',
  'Notifica al equipo y quita el tag de simpatizante activo cuando un contacto baja su nivel de simpatía.',
  'sympathy',
  '📉',
  '{"type": "sympathy_change", "config": {"direction": "down"}}',
  '[]',
  '[{"type": "remove_tag", "config": {"tags": ["simpatizante_activo"]}}, {"type": "notify_team", "config": {"recipients": "campaign_manager", "message": "Un contacto ha bajado su nivel de simpatía. Revisar el perfil y contactar."}}]',
  null,
  false,
  17
),

-- 18. Cambiar simpatía al ser contactado en canvassing
(
  'Actualizar simpatía al contactar exitosamente',
  'Cuando un voluntario registra un contacto exitoso, actualiza el nivel de simpatía a Neutro y agrega el tag "contactado".',
  'canvassing',
  '🚪',
  '{"type": "canvass_result", "config": {"result": "contacted"}}',
  '[]',
  '[{"type": "change_sympathy", "config": {"level": 3}}, {"type": "add_tag", "config": {"tags": ["contactado_campo"]}}]',
  null,
  false,
  18
),

-- 19. Crear evento post-canvassing para voluntario potencial
(
  'Crear evento de seguimiento para voluntario potencial',
  'Cuando alguien dice que quiere ser voluntario, crea un evento en el calendario para hacer el seguimiento.',
  'canvassing',
  '📆',
  '{"type": "canvass_result", "config": {"result": "wants_to_volunteer"}}',
  '[]',
  '[{"type": "create_calendar_event", "config": {"title": "Seguimiento a voluntario potencial detectado en campo", "days_offset": 2}}, {"type": "create_task", "config": {"title": "Llamar a {first_name} — quiere ser voluntario", "assigned_to": "zone_coordinator", "due_in_hours": 48}}]',
  null,
  true,
  19
),

-- 20. Seguimiento a voluntario potencial detectado
(
  'Notificación y tarea para voluntario potencial',
  'Notifica al equipo y crea una tarea cuando alguien expresa interés en ser voluntario durante el canvassing.',
  'canvassing',
  '🤝',
  '{"type": "canvass_result", "config": {"result": "wants_to_volunteer"}}',
  '[]',
  '[{"type": "add_tag", "config": {"tags": ["voluntario_potencial"]}}, {"type": "notify_team", "config": {"recipients": "all_coordinators", "message": "Nuevo voluntario potencial detectado en campo. Revisar perfil y hacer seguimiento."}}, {"type": "create_task", "config": {"title": "Seguimiento urgente — voluntario potencial", "assigned_to": "zone_coordinator", "due_in_hours": 24}}]',
  null,
  false,
  20
),

-- 21. Respuesta automática a mensaje entrante WhatsApp
(
  'Responder a mensaje entrante de WhatsApp',
  'Cuando un contacto responde un WhatsApp, crea una tarea y notifica al equipo para dar seguimiento personalizado.',
  'comms',
  '↩️',
  '{"type": "contact_replied", "config": {"channel": "whatsapp"}}',
  '[]',
  '[{"type": "create_task", "config": {"title": "Responder mensaje de WhatsApp de {first_name}", "assigned_to": "zone_coordinator", "due_in_hours": 4}}, {"type": "notify_team", "config": {"recipients": "campaign_manager", "message": "Un contacto respondió tu WhatsApp. Revisa la conversación y responde."}}]',
  null,
  true,
  21
),

-- 22. Notificación interna por respuesta SMS
(
  'Notificación interna al recibir respuesta SMS',
  'Cuando un contacto responde un SMS, notifica al equipo y agrega el tag para seguimiento.',
  'comms',
  '📲',
  '{"type": "contact_replied", "config": {"channel": "sms"}}',
  '[]',
  '[{"type": "notify_team", "config": {"recipients": "campaign_manager", "message": "Contacto respondió SMS. Revisar y hacer seguimiento."}}, {"type": "add_tag", "config": {"tags": ["respondio_sms", "requiere_seguimiento"]}}]',
  null,
  false,
  22
),

-- 23. Recordatorio de evento — 1 día antes
(
  'Recordatorio de evento — 1 día antes',
  'Envía WhatsApp y SMS de recordatorio a todos los contactos 1 día antes de un evento del calendario.',
  'electoral',
  '🗳️',
  '{"type": "calendar_date", "config": {"offset_days": 1, "direction": "before"}}',
  '[]',
  '[{"type": "send_whatsapp", "config": {"message": "Hola {first_name}! 🗳️ Mañana es el gran día. Te esperamos en el evento de {candidate_name}. ¡Tu presencia es muy importante para nosotros!", "fallback": "sms"}}, {"type": "send_sms", "config": {"message": "Recordatorio: mañana es el evento de {candidate_name}. ¡Te esperamos! Responde INFO para más detalles."}}]',
  'Hola María! 🗳️ Mañana es el gran día. Te esperamos en el evento...',
  true,
  23
),

-- 24. Movilización electoral — 3 días antes
(
  'Movilización electoral — 3 días antes del evento',
  'Envía un mensaje de movilización y crea tareas para el equipo 3 días antes de un evento importante.',
  'electoral',
  '📣',
  '{"type": "calendar_date", "config": {"offset_days": 3, "direction": "before"}}',
  '[]',
  '[{"type": "send_whatsapp", "config": {"message": "Hola {first_name}! 📣 En 3 días tenemos un evento muy importante de la campaña de {candidate_name}. ¿Puedes confirmar tu asistencia?", "fallback": "sms"}}, {"type": "create_task", "config": {"title": "Confirmar asistencia al evento con {first_name}", "assigned_to": "zone_coordinator", "due_in_hours": 48}}, {"type": "notify_team", "config": {"recipients": "all_coordinators", "message": "Iniciar movilización para el evento de en 3 días."}}]',
  'Hola María! 📣 En 3 días tenemos un evento muy importante...',
  true,
  24
),

-- 25. Agradecimiento post-evento
(
  'Email de agradecimiento post-evento',
  'Envía un email de agradecimiento a los asistentes 1 día después de un evento del calendario.',
  'electoral',
  '🙏',
  '{"type": "calendar_date", "config": {"offset_days": 1, "direction": "after"}}',
  '[]',
  '[{"type": "send_email", "config": {"subject": "Gracias por estar presente, {first_name}", "body": "Hola {first_name},\n\nQueremos agradecerte por haber asistido a nuestro evento de ayer. Tu presencia y apoyo son fundamentales para nuestra campaña.\n\nSeguiremos trabajando juntos para lograr el cambio que nuestra comunidad necesita.\n\nUn abrazo,\n{candidate_name}"}}, {"type": "add_tag", "config": {"tags": ["asistio_evento"]}}]',
  'Hola María,\n\nQueremos agradecerte por haber asistido a nuestro evento de ayer...',
  true,
  25
);
