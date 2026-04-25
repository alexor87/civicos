# Mensajería multi-proveedor — Infobip + Twilio

**Fecha:** 2026-04-21
**Estado:** Borrador
**Autor:** CTO (Claude)
**Aprobado por:** PM (Usuario)

---

## Problema / Necesidad

Hoy CivicOS solo permite usar **Twilio** para SMS y WhatsApp. La integración con Twilio está hardcoded en 5 lugares del código (sms-actions, whatsapp-actions, webhook entrante, journey-runner, formulario de integraciones), sin ninguna capa de abstracción. La tabla `tenant_integrations` tiene columnas con nombre Twilio (`twilio_sid`, `twilio_token`, `twilio_from`, `twilio_whatsapp_from`).

Esto trae dos problemas:

1. **Costos:** Twilio es uno de los proveedores más caros para SMS/WhatsApp en LatAm. Para una campaña política colombiana con 500K mensajes mensuales, Infobip es ~50-60% más barato.
2. **Lock-in técnico:** agregar cualquier otro proveedor hoy requiere duplicar lógica en 5 lugares y modificar el esquema de la DB.

El usuario PM decidió agregar **Infobip** como segundo proveedor, manteniendo Twilio funcionando para no romper a tenants existentes.

## Solución propuesta

Refactor de la capa de mensajería para soportar **N proveedores** vía un patrón dispatcher con interfaces tipadas. Twilio se queda como un adaptador más, e Infobip se agrega como adaptador nuevo. La elección de proveedor es **por tenant y por canal** (un tenant puede usar Twilio para SMS e Infobip para WhatsApp, o viceversa).

**Lo que ve el PM en la UI:**
- En `/dashboard/settings/integrations`, dos cards nuevos: "SMS" y "WhatsApp" (en lugar de los actuales con marca Twilio).
- Cada card tiene un selector "Proveedor: Twilio / Infobip" y campos dinámicos según la elección.
- Botón "Probar conexión" funciona para ambos.
- Si un tenant ya tenía Twilio configurado, sigue viéndolo configurado tras la migración (no pierde nada).

**Lo que cambia por dentro:**
- Una interfaz `MessagingProvider` con métodos `sendSMS`, `sendWhatsApp`, `validateInboundSignature`.
- Adaptadores: `TwilioProvider`, `InfobipProvider`.
- Un dispatcher (`getMessagingProvider(tenantId, channel)`) que lee la config y devuelve el adaptador correcto.
- Schema neutralizado: nuevas columnas `sms_provider`, `whatsapp_provider` (enum) + `provider_config` JSONB cifrado.
- Webhook entrante con ruta separada por proveedor (`/api/webhooks/twilio/whatsapp`, `/api/webhooks/infobip/whatsapp`) porque las firmas y payloads son distintos.

## Requisitos funcionales

- [ ] RF-1: El PM puede elegir entre Twilio e Infobip por canal (SMS y WhatsApp) desde la UI de Integrations, sin tocar código.
- [ ] RF-2: Las campañas SMS y WhatsApp existentes siguen funcionando exactamente igual que hoy si el tenant no cambia su configuración (compatibilidad total con Twilio).
- [ ] RF-3: Al elegir Infobip, los campos requeridos son: API Key, Base URL (subdominio asignado por Infobip al cliente), número/sender SMS, número/sender WhatsApp. Todos cifrados con la misma estrategia que las claves Twilio (pgp_sym_encrypt).
- [ ] RF-4: El botón "Probar conexión" hace una llamada de prueba al proveedor (a un endpoint inocuo, ej. balance check) y reporta éxito/fallo con mensaje claro.
- [ ] RF-5: Las campañas SMS/WhatsApp envían vía el proveedor configurado por el tenant.
- [ ] RF-6: Los webhooks entrantes de WhatsApp funcionan con ambos proveedores (firma validada según el proveedor que disparó el webhook).
- [ ] RF-7: El journey-runner (Supabase Edge Function) también respeta la elección de proveedor del tenant para SMS automatizados.
- [ ] RF-8: La migración de datos copia la config Twilio existente al nuevo formato sin downtime y sin acción del PM.
- [ ] RF-9: Si el provider config está incompleto (ej. falta API key), las acciones de envío fallan con un mensaje claro al PM (no silenciosamente).

## Diseño técnico

### Arquitectura

```
┌────────────────────────────────────────────────────┐
│  Send sites                                         │
│  - sms-actions.ts                                   │
│  - whatsapp-actions.ts                              │
│  - journey-runner (Edge Function)                   │
└──────────────────┬─────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────┐
│  lib/messaging/dispatcher.ts                        │
│  getMessagingProvider(tenantId, channel)            │
│  → reads tenant_integrations, returns adapter       │
└──────────────────┬─────────────────────────────────┘
                   │
       ┌───────────┴────────────┐
       ▼                        ▼
┌──────────────┐         ┌──────────────┐
│ TwilioProvider│         │InfobipProvider│
│  - sendSMS    │         │  - sendSMS    │
│  - sendWA     │         │  - sendWA     │
│  - validateWh │         │  - validateWh │
└──────────────┘         └──────────────┘
```

### Interfaz `MessagingProvider`

```ts
// lib/messaging/types.ts
export type MessagingChannel = 'sms' | 'whatsapp'
export type ProviderId = 'twilio' | 'infobip'

export interface SendSMSParams {
  to: string         // E.164
  body: string
  from?: string      // optional override of tenant default
}

export interface SendWhatsAppParams {
  to: string         // E.164
  templateName?: string
  templateLanguage?: string
  templateVariables?: Record<string, string>
  body?: string      // for free-form session messages (24h window)
}

export interface SendResult {
  ok: boolean
  providerMessageId?: string
  error?: string
  errorCode?: string
}

export interface MessagingProvider {
  readonly id: ProviderId
  sendSMS(params: SendSMSParams): Promise<SendResult>
  sendWhatsApp(params: SendWhatsAppParams): Promise<SendResult>
  validateInboundSignature(req: Request): Promise<boolean>
  testConnection(): Promise<{ ok: boolean; error?: string }>
}
```

### Archivos a crear

| Archivo | Propósito |
|---------|-----------|
| `apps/web/lib/messaging/types.ts` | Tipos compartidos del dispatcher (`MessagingProvider`, `SendSMSParams`, etc.). |
| `apps/web/lib/messaging/dispatcher.ts` | `getMessagingProvider(tenantId, campaignId, channel)` — busca config en DB y devuelve adaptador instanciado. |
| `apps/web/lib/messaging/providers/twilio.ts` | Adaptador Twilio. Mueve aquí toda la lógica que hoy está duplicada en sms-actions, whatsapp-actions, webhook. |
| `apps/web/lib/messaging/providers/infobip.ts` | Adaptador Infobip nuevo. Usa REST API directa (sin SDK — Infobip no tiene SDK Node oficial maintained). |
| `apps/web/app/api/webhooks/infobip/whatsapp/route.ts` | Webhook entrante de WhatsApp para Infobip (formato diferente al de Twilio). |
| `apps/web/app/api/webhooks/twilio/whatsapp/route.ts` | Renombrar el webhook actual (de `/api/webhooks/whatsapp` a `/api/webhooks/twilio/whatsapp`) y mantener el path viejo redirigiendo (para no romper webhooks ya configurados en consola Twilio). |
| `apps/web/app/api/settings/integrations/test-infobip/route.ts` | Endpoint para probar credenciales de Infobip desde la UI. |
| `supabase/migrations/068_messaging_provider_config.sql` | Migración aditiva del schema. |
| `apps/web/__tests__/lib/messaging/dispatcher.test.ts` | Tests del dispatcher. |
| `apps/web/__tests__/lib/messaging/providers/infobip.test.ts` | Tests del adaptador Infobip (con fetch mockeado). |
| `apps/web/__tests__/lib/messaging/providers/twilio.test.ts` | Tests del adaptador Twilio (refactor de tests existentes). |
| `apps/web/__tests__/api/webhooks/infobip-whatsapp.test.ts` | Tests del webhook Infobip. |

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `apps/web/app/dashboard/comunicaciones/sms-actions.ts` | Reemplazar instanciación directa de `twilio()` por `getMessagingProvider(tenantId, campaignId, 'sms')` + `provider.sendSMS()`. |
| `apps/web/app/dashboard/comunicaciones/whatsapp-actions.ts` | Mismo refactor para WhatsApp. |
| `supabase/functions/journey-runner/index.ts` | Cambiar de HTTP directo a Twilio por una versión que lea la config del tenant y use el endpoint correcto según provider. |
| `apps/web/components/settings/IntegrationsForm.tsx` | Reemplazar 2 cards Twilio por 2 cards genéricos (SMS, WhatsApp) con selector de proveedor + campos dinámicos. |
| `apps/web/app/api/settings/integrations/route.ts` | Aceptar y guardar la nueva forma del payload (provider + config por proveedor). Mantener acepta la forma vieja (twilio_*) por compat durante 1 mes. |
| `apps/web/lib/get-integration-config.ts` | Devolver una estructura tipada que incluye qué provider está activo por canal. |
| `apps/web/app/api/webhooks/whatsapp/route.ts` | Convertir en redirect a `/api/webhooks/twilio/whatsapp` (para no romper webhooks Twilio ya registrados). |

### Schema migration (068)

```sql
-- Additive migration. Twilio columns existing today are NOT dropped in this migration.
-- A follow-up cleanup migration removes them after 30 days of dual-write.

ALTER TABLE tenant_integrations
  ADD COLUMN sms_provider      text NOT NULL DEFAULT 'twilio'
    CHECK (sms_provider IN ('twilio', 'infobip')),
  ADD COLUMN whatsapp_provider text NOT NULL DEFAULT 'twilio'
    CHECK (whatsapp_provider IN ('twilio', 'infobip')),
  -- JSONB cifrado: contiene la config específica de cada proveedor.
  -- Estructura: { twilio: {...}, infobip: {...} }
  -- Cifrado a nivel de aplicación con pgp_sym_encrypt (mismo flujo que twilio_token).
  ADD COLUMN provider_config_encrypted bytea,
  ADD COLUMN provider_config_hint     jsonb DEFAULT '{}'::jsonb;
  -- ↑ hint guarda solo info no sensible para mostrar en UI sin descifrar
  --   ej: { "twilio": { "sid_last4": "1a2b" }, "infobip": { "base_url": "abc.api.infobip.com" } }

COMMENT ON COLUMN tenant_integrations.sms_provider IS
  'Active SMS provider for this tenant/campaign. Defaults to twilio for back-compat.';
COMMENT ON COLUMN tenant_integrations.whatsapp_provider IS
  'Active WhatsApp provider for this tenant/campaign. Defaults to twilio.';
COMMENT ON COLUMN tenant_integrations.provider_config_encrypted IS
  'pgp_sym_encrypt of JSON: { twilio: { sid, token, sms_from, wa_from }, infobip: { api_key, base_url, sms_from, wa_from } }';
```

**Migración de datos existentes** (parte de la misma migración):
```sql
-- For every existing row with Twilio config, copy it into provider_config_encrypted.
-- This way both old columns AND new column work in parallel during the transition.
UPDATE tenant_integrations
SET provider_config_encrypted = pgp_sym_encrypt(
  json_build_object(
    'twilio', json_build_object(
      'sid',     twilio_sid,
      'token',   pgp_sym_decrypt(twilio_token, current_setting('app.encryption_key')),
      'sms_from', twilio_from,
      'wa_from',  twilio_whatsapp_from
    )
  )::text,
  current_setting('app.encryption_key')
)
WHERE twilio_sid IS NOT NULL OR twilio_from IS NOT NULL;
```

(La migración de cleanup —dropear las columnas viejas— se hace en una migración separada cuando estemos seguros de que no quedan lecturas.)

### API de Infobip

**SMS:** `POST https://{base_url}/sms/2/text/advanced`
```json
{
  "messages": [{
    "from": "Scrutix",
    "destinations": [{ "to": "+573001234567" }],
    "text": "Tu mensaje aquí"
  }]
}
```
Headers: `Authorization: App {api_key}`, `Content-Type: application/json`

**WhatsApp template:** `POST https://{base_url}/whatsapp/1/message/template`
```json
{
  "messages": [{
    "from": "447860099299",
    "to": "+573001234567",
    "content": {
      "templateName": "campana_bogota",
      "templateData": { "body": { "placeholders": ["María", "Bogotá"] } },
      "language": "es"
    }
  }]
}
```

**Validación de webhook entrante:** Infobip usa header `X-Signature-Sha256` con HMAC-SHA256 del body usando el `webhook_secret`. Implementación con `crypto.createHmac` igual que el flow existente de Resend webhooks.

### UI cambios concretos

Card "SMS" (reemplaza "Twilio SMS"):
```
┌─────────────────────────────────────────┐
│ SMS                          [Conectado]│
│                                         │
│ Proveedor: ( ) Twilio   ( ) Infobip     │
│                                         │
│ ─── (campos dinámicos según selección)──│
│                                         │
│ [Si Twilio]                             │
│ Account SID: [______________]           │
│ Auth Token:  [______________]           │
│ Número:      [______________]           │
│                                         │
│ [Si Infobip]                            │
│ API Key:   [______________]             │
│ Base URL:  [______________]             │
│ Sender:    [______________]             │
│                                         │
│ [Probar conexión]  [Guardar]            │
└─────────────────────────────────────────┘
```

Mismo patrón para card "WhatsApp".

## Edge cases

| Caso | Comportamiento esperado |
|------|------------------------|
| Tenant existente con Twilio config | Tras la migración, sigue viendo "SMS — Twilio — Conectado". No requiere acción. |
| Tenant cambia de Twilio a Infobip mid-campaign | La campaña en envío sigue con el provider con el que arrancó. Las nuevas usan el nuevo. |
| Infobip API key inválida al guardar | El endpoint de guardar valida con `testConnection()` antes de persistir; si falla, no guarda y muestra error específico. |
| Webhook entrante con firma inválida | Devuelve 401, no procesa el mensaje. Loggea con `console.warn` para alertar. |
| Provider seleccionado pero sin config | El dispatcher arroja un error tipado que la UI traduce a "Configura las credenciales antes de enviar". |
| Provider no soportado en el JSON config | El dispatcher devuelve null y el send falla con mensaje claro. No crashea. |
| Migración corre en producción con miles de filas | La migración 068 es transaccional por fila; no bloquea más de unos segundos. Aún así se prueba en staging. |
| Twilio webhook URL ya registrado en consola Twilio | El path viejo `/api/webhooks/whatsapp` redirige a `/api/webhooks/twilio/whatsapp`. Permanece estable. |
| Caracteres no-ASCII en SMS Infobip | Infobip detecta encoding automático (Unicode = límite de 70 caracteres por SMS, ASCII = 160). El adaptador no necesita lógica especial. |

## Criterios de aceptación

- [ ] CA-1: En staging, un tenant configurado con Twilio sigue enviando SMS y WhatsApp exactamente como antes (regresión cero).
- [ ] CA-2: Un tenant nuevo puede elegir Infobip en SMS y enviar una campaña SMS de prueba que llega al destinatario.
- [ ] CA-3: Lo mismo para WhatsApp con Infobip (template aprobado en su consola Meta).
- [ ] CA-4: El webhook entrante de WhatsApp Infobip recibe un mensaje del usuario, valida firma HMAC, y crea registro en `whatsapp_conversations` igual que con Twilio.
- [ ] CA-5: El botón "Probar conexión" de Infobip valida API key con un GET al endpoint de balance/cuenta.
- [ ] CA-6: La migración 068 corre en staging sin pérdida de datos. Tenants existentes ven su config Twilio intacta.
- [ ] CA-7: Todos los tests existentes siguen pasando + tests nuevos del dispatcher e Infobip pasan.
- [ ] CA-8: Build sin warnings.
- [ ] CA-9: Deploy a producción exitoso con env vars actualizadas.

## Plan de implementación por fases

**Fase 1 — Refactor sin nuevo proveedor (PR independiente, deploy seguro):**
1. Crear `lib/messaging/types.ts`, `dispatcher.ts`, `providers/twilio.ts`.
2. Migrar sms-actions, whatsapp-actions, webhook entrante para usar el dispatcher con TwilioProvider.
3. Tests de regresión del dispatcher.
4. Deploy. Comportamiento idéntico al anterior.

**Fase 2 — Schema migration (independiente):**
1. Migración 068 (additive, escribe `provider_config_encrypted` desde columnas Twilio).
2. Backfill de datos existentes.
3. Deploy. UI todavía no muestra selector — solo persiste en formato nuevo además del viejo.

**Fase 3 — Adaptador Infobip + UI (PR principal):**
1. `providers/infobip.ts` + tests.
2. Endpoint `test-infobip`.
3. UI: cards genéricos con selector de proveedor.
4. Webhook Infobip.
5. Modificar journey-runner para leer provider del tenant.
6. Deploy.

**Fase 4 — Cleanup (1 mes después):**
1. Migración para dropear columnas Twilio sueltas (`twilio_sid`, `twilio_token`, etc.) una vez verificado que todos los reads usan `provider_config_encrypted`.

## Out of scope

- **Otros proveedores** (Hablame, MessageBird, Vonage). El refactor los habilita pero solo implementamos Twilio + Infobip ahora.
- **Email multi-proveedor.** Resend se queda solo. Es un canal distinto, fuera del alcance.
- **Voz / IVR.** No estaba antes, no se agrega.
- **Failover automático** entre proveedores (si Twilio falla, intentar con Infobip). Es interesante pero agrega complejidad; lo evaluamos si la confiabilidad lo amerita.
- **Métricas comparativas** entre proveedores en el dashboard. Se puede agregar después como feature aparte.

## Notas

**Decisión: dispatcher en runtime vs build-time.**
Elegimos runtime (lookup en DB en cada send) porque la decisión es por tenant. Cache en memoria del adaptador instanciado por tenant para evitar leer DB en cada mensaje (TTL 60s).

**Decisión: separar webhooks por proveedor.**
La firma y el payload son distintos (Twilio firma con SHA1 del body URL-encoded, Infobip con SHA256 del JSON). Mezclar en un solo handler con if/else es frágil. Una ruta por proveedor es más limpia.

**Decisión: SDK vs HTTP directo para Infobip.**
Infobip no tiene SDK Node oficial mantenido (existe uno legacy abandonado). Usamos `fetch` directo con sus REST endpoints. Documentación en https://www.infobip.com/docs/api.

**Decisión: cifrado del config.**
Reusamos `pgp_sym_encrypt` con `app.encryption_key` igual que las claves Twilio actuales. Un único campo cifrado JSONB simplifica la lógica vs N columnas cifradas por proveedor.

**Riesgo principal:** en migration 068, descifrar+recifrar `twilio_token` requiere que la migración tenga acceso a `app.encryption_key`. Probar en staging primero. Si falla, plan B es hacer el backfill desde código de aplicación en lugar de SQL puro.

**Tiempo estimado:** 3-4 sesiones de implementación (Fase 1: 1 sesión; Fase 2: 0.5 sesión; Fase 3: 2 sesiones; Fase 4: posterior).

**Acción requerida del PM antes de implementar:**
1. Crear cuenta en Infobip y obtener: API key, Base URL asignado, número/sender de SMS, sender ID de WhatsApp.
2. Aprobar al menos un template de WhatsApp en la consola Meta vía Infobip (idealmente el mismo template que ya está aprobado en Twilio).
3. Confirmar el número/sender SMS habilitado para Colombia (si la campaña principal es allí).
4. Aprobar esta spec.
