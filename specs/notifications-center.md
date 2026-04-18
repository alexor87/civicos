# Centro de Notificaciones

**Fecha:** 2026-04-18
**Estado:** Aprobada
**Autor:** CTO (Claude)
**Aprobado por:** PM (Usuario)

---

## Problema / Necesidad

El botón de notificaciones (campana) en el header del dashboard es decorativo — no tiene onClick, no hay dropdown, no hay tabla en DB, no hay API. Los usuarios no pueden ver alertas sobre eventos importantes de su campaña.

## Solución propuesta

Implementar un centro de notificaciones funcional: clic en la campana abre un popover con notificaciones recientes, badge solo cuando hay no-leídas, marcar como leídas, y actualización en tiempo real.

## Requisitos funcionales

- [x] RF-1: Clic en la campana abre un popover con lista de notificaciones
- [x] RF-2: Badge rojo aparece solo si hay notificaciones no leídas (muestra cantidad)
- [x] RF-3: Cada notificación muestra: ícono por tipo, título, descripción, tiempo relativo
- [x] RF-4: Clic en una notificación la marca como leída y navega a la sección relevante
- [x] RF-5: Botón "Marcar todas como leídas" en el header del popover
- [x] RF-6: Notificaciones nuevas aparecen en tiempo real sin recargar
- [x] RF-7: Se muestran las últimas 20 notificaciones
- [x] RF-8: Respetar la preferencia del usuario (notificaciones desactivadas → sin badge)

## Tipos de notificación (MVP)

| Tipo | Descripción | Navega a |
|------|-------------|----------|
| `new_contact` | Nuevo contacto registrado | `/dashboard/contacts` |
| `new_registration` | Registro público recibido | `/dashboard/contacts` |
| `task_completed` | Tarea completada | `/dashboard/calendar` |
| `flow_triggered` | Un flow se ejecutó | `/dashboard/automatizaciones` |
| `team_mention` | Mención del equipo | `/dashboard/team` |
| `system` | Alertas del sistema | — |

## Diseño técnico

### Archivos a crear
| Archivo | Propósito |
|---------|-----------|
| `supabase/migrations/068_notifications.sql` | Tabla + RLS + índices |
| `apps/web/components/dashboard/NotificationCenter.tsx` | Popover con lista |
| `apps/web/hooks/useNotifications.ts` | Hook: fetch, realtime, marcar leído |
| `apps/web/app/api/notifications/route.ts` | GET + PATCH |

### Archivos a modificar
| Archivo | Cambio |
|---------|--------|
| `apps/web/components/dashboard/DashboardHeader.tsx` | Reemplazar botón campana por `<NotificationCenter />` |

### API / Data model

Tabla `notifications` con RLS por user_id. API GET lista + PATCH marca leídas.

## Edge cases

| Caso | Comportamiento esperado |
|------|------------------------|
| Sin notificaciones | Estado vacío, sin badge |
| Notificaciones desactivadas | Sin badge, popover muestra mensaje |
| Sin link | Solo marca como leída |
| >99 no leídas | Badge muestra "99+" |

## Criterios de aceptación

- [x] CA-1: Clic en campana abre popover con notificaciones
- [x] CA-2: Badge aparece solo con no-leídas
- [x] CA-3: Clic en notificación navega y marca leída
- [x] CA-4: "Marcar todas" limpia badge
- [x] CA-5: Realtime funciona
- [x] CA-6: Tests pasan
- [ ] CA-7: Deploy exitoso

## Out of scope

- Push notifications del navegador
- Notificaciones por email
- Página completa de historial
- Configuración granular por tipo
- Generación automática desde flows/triggers
