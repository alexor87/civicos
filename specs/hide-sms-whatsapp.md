# Ocultar SMS y WhatsApp temporalmente — solo email visible

**Fecha:** 2026-04-24
**Estado:** Aprobada — en desarrollo
**Autor:** CTO (Claude)
**Aprobado por:** PM (Alexander)

---

## Problema / Necesidad

No tenemos proveedores de SMS y WhatsApp operativos (Infobip requiere KYC + activación de rutas Colombia, Twilio sin contratar). Mientras se decide la estrategia de proveedores, **toda la UI de SMS y WhatsApp debe quedar oculta para los usuarios**, dejando solo email funcional. No queremos eliminar el código (volveremos sobre él) — solo hacer invisible la funcionalidad.

## Solución propuesta

**Feature flags globales** en un único módulo (`apps/web/lib/features/messaging-channels.ts`) con dos constantes:

```ts
export const SMS_CHANNEL_ENABLED      = false
export const WHATSAPP_CHANNEL_ENABLED = false
```

Estas se importan en todos los puntos de UI/server y gobiernan el render condicional. **Para reactivar la funcionalidad, basta cambiar los valores a `true`** — no requiere migración, ni cambios en DB, ni redeploy de env vars.

Cuando ambos están en `false`, la UI se comporta como si solo existiera email:
- Tabs SMS y WhatsApp no se renderizan
- Routes `/dashboard/comunicaciones/sms/*` y `/whatsapp/*` redirigen a email
- Cards de integración SMS y WhatsApp ocultas en `/dashboard/settings/integrations`
- Acciones `send_sms` y `send_whatsapp` removidas del flow builder
- Tipo `sms` removido del Content Studio (Contenido IA)
- KPIs de SMS removidos de `/dashboard/reportes`
- Share button de WhatsApp en página pública de registro: oculto
- Server actions `createSmsCampaign`, `sendSmsCampaign`, etc. retornan early con error si se llaman directamente
- Webhooks responden 503 si llegan eventos mientras está deshabilitado

## Requisitos funcionales

- [ ] RF-1: Crear módulo `lib/features/messaging-channels.ts` con `SMS_CHANNEL_ENABLED` y `WHATSAPP_CHANNEL_ENABLED` (ambos `false` por default).
- [ ] RF-2: Tabs en `/dashboard/comunicaciones`: solo render Email cuando ambos canales están off. Si solo uno está off, mantener los otros.
- [ ] RF-3: Rutas `/dashboard/comunicaciones/sms/*` y `/whatsapp/*` redirigen a `/dashboard/comunicaciones?tab=email` cuando el canal está deshabilitado.
- [ ] RF-4: Cards SMS y WhatsApp ocultas en `IntegrationsForm.tsx` (settings).
- [ ] RF-5: Acciones `send_sms` y `send_whatsapp` removidas del menú del flow builder. Triggers existentes con esas acciones siguen guardadas en DB pero el editor las marca como "deshabilitadas" para que el usuario las elimine o ignore.
- [ ] RF-6: Trigger `contact_replied` restringe el channel selector a `email` cuando los otros están off.
- [ ] RF-7: Content Studio (Contenido IA) — `sms` removido del dropdown de tipos de contenido.
- [ ] RF-8: SmartCommsPanel sugiere solo email-related actions cuando los otros canales están off.
- [ ] RF-9: Reportes — KPI de "SMS enviados" oculto. Total de comunicaciones = solo emails.
- [ ] RF-10: Public registration — el share button de WhatsApp queda oculto en la página pública de "mis referidos".
- [ ] RF-11: Server actions y API routes de SMS/WhatsApp retornan `{ error: 'Canal SMS/WhatsApp deshabilitado temporalmente' }` (HTTP 503 para API routes) cuando se invocan con el flag off.
- [ ] RF-12: La sidebar no cambia — "Comunicaciones" sigue visible (lleva al hub que ahora solo muestra email).

## Diseño técnico

### Archivos a crear
| Archivo | Propósito |
|---------|-----------|
| `apps/web/lib/features/messaging-channels.ts` | Define `SMS_CHANNEL_ENABLED` y `WHATSAPP_CHANNEL_ENABLED` |
| `apps/web/__tests__/features/messaging-channels.test.ts` | Tests de los flags y de helpers |

### Archivos a modificar (UI)
| Archivo | Cambio |
|---------|--------|
| `apps/web/app/dashboard/comunicaciones/page.tsx` | Render condicional de tabs SMS y WhatsApp; si solo email, no muestra tab bar; redirige `?tab=sms` a email |
| `apps/web/app/dashboard/comunicaciones/sms/new/page.tsx` | Redirect a `/dashboard/comunicaciones?tab=email` si flag off |
| `apps/web/app/dashboard/comunicaciones/sms/[id]/page.tsx` | Redirect si flag off |
| `apps/web/app/dashboard/comunicaciones/sms/[id]/edit/page.tsx` | Redirect si flag off |
| `apps/web/app/dashboard/comunicaciones/whatsapp/new/page.tsx` | Redirect si flag off |
| `apps/web/app/dashboard/comunicaciones/whatsapp/[id]/page.tsx` | Redirect si flag off |
| `apps/web/components/settings/IntegrationsForm.tsx` | Esconder cards SMS y WhatsApp |
| `apps/web/components/dashboard/flows/VisualFlowEditor.tsx` | Filtrar `send_sms` y `send_whatsapp` del menú de acciones |
| `apps/web/components/dashboard/flows/flowTypes.ts` | (opcional) helper para listar acciones habilitadas |
| `apps/web/app/dashboard/contenido/page.tsx` | Filtrar tipo `sms` del dropdown |
| `apps/web/components/dashboard/comunicaciones/SmartCommsPanel.tsx` | Restringir suggestions a email |
| `apps/web/app/dashboard/reportes/page.tsx` | Ocultar KPIs de SMS; usar solo email reach |
| `apps/web/components/settings/PublicRegistrationSettingsForm.tsx` | Ocultar campo `whatsapp_share_message` (si lo hay) |
| `apps/web/app/registro/[id]/page.tsx` (o public referral page) | Ocultar share button de WhatsApp |

### Archivos a modificar (server)
| Archivo | Cambio |
|---------|--------|
| `apps/web/app/dashboard/comunicaciones/sms-actions.ts` | Cada función pública chequea flag y retorna early si está off |
| `apps/web/app/dashboard/comunicaciones/whatsapp-actions.ts` | Mismo |
| `apps/web/app/api/webhooks/whatsapp/route.ts` | Retorna 503 si flag off |
| `apps/web/app/api/webhooks/infobip/whatsapp/route.ts` | Retorna 503 si flag off |
| `apps/web/app/api/settings/integrations/test-twilio/route.ts` | 503 si los canales están off |
| `apps/web/app/api/settings/integrations/test-infobip/route.ts` | 503 si los canales están off |

### Cosas que se DEJAN intactas (cuando se reactiven los flags, todo vuelve)
- Migraciones (074 y todas las anteriores)
- Tablas `sms_campaigns`, `whatsapp_campaigns`, `whatsapp_conversations`, `whatsapp_chatbot_config`
- Código del dispatcher, providers, edge functions
- Tipos en `lib/messaging/types.ts`
- Tests existentes de SMS/WhatsApp (siguen pasando — testean el código que está oculto pero funcional)

## Edge cases

| Caso | Comportamiento esperado |
|------|------------------------|
| Usuario abre `/dashboard/comunicaciones?tab=sms` directamente con flag off | Redirect 302 a `?tab=email` |
| Flow guardado con acción `send_sms` cuando flag se apaga | El runner detecta el flag y omite la acción, registra en logs. El editor muestra la acción con badge "Deshabilitada — eliminar" |
| Webhook de WhatsApp llega cuando flag está off (proveedor antiguo aún manda eventos) | Retorna 503, no procesa. Logs incluyen el evento para debugging |
| Reactivación: usuario flipa flags a `true` | Todo vuelve a aparecer sin migración. Las campañas viejas (drafts/sent) siguen accesibles |
| Tenant diferente quiere SMS habilitado pero otro no | Out of scope — flags son globales en esta iteración. Si se requiere granularidad, mover a `feature_flags` table existente (mig 047) |

## Criterios de aceptación

- [ ] CA-1: Con `SMS_CHANNEL_ENABLED=false` y `WHATSAPP_CHANNEL_ENABLED=false`: `/dashboard/comunicaciones` solo muestra UI de email, sin tabs.
- [ ] CA-2: `/dashboard/settings/integrations` solo muestra cards de IA y Email, oculta SMS y WhatsApp.
- [ ] CA-3: Flow builder no permite añadir acciones `send_sms` ni `send_whatsapp`.
- [ ] CA-4: Content Studio no ofrece tipo `sms`.
- [ ] CA-5: Reportes no muestra métricas de SMS.
- [ ] CA-6: Acceso directo a `/dashboard/comunicaciones/sms/new` redirige a email.
- [ ] CA-7: `pnpm vitest run` sigue verde — tests de SMS/WhatsApp siguen pasando porque el código backend está intacto.
- [ ] CA-8: `pnpm next build` verde.
- [ ] CA-9: Reactivar flipando ambas constantes a `true` restaura toda la UI sin redeploys de migraciones.

## Out of scope

- Per-tenant feature flags (todos los tenants ven lo mismo).
- Eliminar código de SMS/WhatsApp.
- Eliminar campañas SMS/WhatsApp existentes en DB.
- Cambios en migraciones.
- Decisión final del proveedor de mensajería (lo veremos por separado).

## Notas

- El sistema de feature flags por tenant que ya existe (`lib/features/feature-keys.ts`, mig 047) **no se usa aquí** porque la decisión es global. Si en el futuro queremos permitir SMS para algunos tenants y no otros, migramos a ese sistema.
- Las constantes están en un módulo TS plano (no env vars) para evitar problemas con `NEXT_PUBLIC_*` y para que client + server importen del mismo lugar sin runtime overhead.
