# Selección manual de destinatarios en campañas SMS (y WhatsApp)

**Fecha:** 2026-04-24
**Estado:** Aprobada — en desarrollo
**Autor:** CTO (Claude)
**Aprobado por:** PM (Alexander)

---

## Problema / Necesidad

En el editor de email (`/dashboard/comunicaciones/new`) ya se puede elegir "Selección manual" y escoger contactos uno por uno. En el editor de SMS (`/dashboard/comunicaciones/sms/new`) solo se puede elegir entre "Todos los contactos con teléfono" o un segmento; no hay forma de mandarle a 3 contactos específicos. La misma limitación existe en el editor de WhatsApp.

Los managers de campaña necesitan paridad entre canales para enviar comunicaciones dirigidas (ej: recordar a 10 líderes específicos una reunión).

## Solución propuesta

Replicar exactamente el patrón que ya usa email:
- Añadir una tercera opción "Selección manual" en el dropdown de destinatarios del editor SMS.
- Cuando se elige, aparece el `ContactPicker` (el mismo componente del email) para buscar y añadir contactos por nombre/teléfono.
- Guardar los IDs seleccionados en `sms_campaigns.recipient_ids uuid[]`. Si está seteado, tiene prioridad sobre `segment_id` y sobre "todos".
- El mismo cambio se aplica al editor de WhatsApp (`whatsapp_campaigns.recipient_ids`), para mantener consistencia entre los tres canales.

El `ContactPicker` actual filtra por `c.email`; necesita un prop `requireField: 'email' | 'phone'` para que en SMS/WhatsApp filtre por teléfono.

## Requisitos funcionales

- [ ] RF-1: El editor SMS (`/dashboard/comunicaciones/sms/new` y `/sms/[id]/edit`) muestra un dropdown con tres opciones: "Todos los contactos con teléfono", cada segmento, y "Selección manual".
- [ ] RF-2: Al elegir "Selección manual", aparece un buscador (ContactPicker) que solo muestra contactos con teléfono. Al seleccionar un contacto, queda como chip removible.
- [ ] RF-3: Guardar borrador persiste los IDs seleccionados en `sms_campaigns.recipient_ids`.
- [ ] RF-4: Al enviar una campaña SMS con `recipient_ids` seteado, solo se envía a esos contactos (ignora `segment_id` y "todos"). Orden de prioridad: `recipient_ids` > `segment_id` > todos.
- [ ] RF-5: Mismo comportamiento (RF-1 a RF-4) para WhatsApp, filtrando por teléfono también.
- [ ] RF-6: Las pantallas de detalle (`/comunicaciones/sms/[id]` y `/whatsapp/[id]`) muestran "N destinatarios seleccionados manualmente" cuando aplica.

## Diseño técnico

### Archivos a crear
| Archivo | Propósito |
|---------|-----------|
| `supabase/migrations/074_sms_wa_manual_recipients.sql` | Añade `recipient_ids uuid[]` a `sms_campaigns` y `whatsapp_campaigns` |
| `apps/web/__tests__/comunicaciones/sms-manual-recipients.test.ts` | Tests del flujo completo SMS |
| `apps/web/__tests__/comunicaciones/whatsapp-manual-recipients.test.ts` | Tests del flujo completo WhatsApp |

### Archivos a modificar
| Archivo | Cambio |
|---------|--------|
| `apps/web/components/dashboard/email-builder/ContactPicker.tsx` | Añadir prop `requireField: 'email' \| 'phone'` (default 'email') que filtra y muestra el valor correspondiente |
| `apps/web/components/dashboard/SmsCampaignForm.tsx` | Añadir opción "Selección manual" + ContactPicker con `requireField="phone"` + state de `manualIds` |
| `apps/web/components/dashboard/WhatsappCampaignForm.tsx` | Mismo cambio que SmsCampaignForm |
| `apps/web/app/dashboard/comunicaciones/sms-actions.ts` | `createSmsCampaign` + `updateSmsCampaign` leen `recipient_ids` del FormData; `sendSmsCampaign` usa `recipient_ids` con prioridad sobre segment |
| `apps/web/app/dashboard/comunicaciones/whatsapp-actions.ts` | Mismo cambio que sms-actions.ts |
| `apps/web/app/dashboard/comunicaciones/sms/new/page.tsx` | Pasar `campaignId` al form |
| `apps/web/app/dashboard/comunicaciones/sms/[id]/edit/page.tsx` | Cargar `recipient_ids` en defaultValues |
| `apps/web/app/dashboard/comunicaciones/sms/[id]/page.tsx` | Mostrar "N destinatarios manuales" en el detalle |
| (equivalentes de whatsapp) | — |

### API / Data model
Migration 074:
```sql
ALTER TABLE sms_campaigns
  ADD COLUMN IF NOT EXISTS recipient_ids uuid[];
COMMENT ON COLUMN sms_campaigns.recipient_ids IS
  'Manually selected contact IDs. When set, overrides segment_id.';

ALTER TABLE whatsapp_campaigns
  ADD COLUMN IF NOT EXISTS recipient_ids uuid[];
COMMENT ON COLUMN whatsapp_campaigns.recipient_ids IS
  'Manually selected contact IDs. When set, overrides segment_id.';
```

No requiere nuevo endpoint `/api/contacts/search` — el existente ya devuelve `phone`. Solo hay que filtrar client-side.

## Edge cases

| Caso | Comportamiento esperado |
|------|------------------------|
| Usuario selecciona manual → selecciona 5 contactos → cambia a "Todos" y guarda | `recipient_ids` queda null, se respeta la nueva selección |
| Algunos IDs manuales ya no tienen teléfono al momento de enviar | Se excluyen silenciosamente; `recipient_count` refleja los enviados |
| Lista manual vacía (0 contactos) pero modo = 'manual' | Al enviar: error "No hay destinatarios manuales seleccionados" |
| Un ID manual fue soft-deleted entre borrador y envío | Se excluye |
| Campaña `sent` intenta editarse | Bloqueado en UI + servidor (ya existe check `status = 'draft'`) |

## Criterios de aceptación

- [ ] CA-1: En el tenant Jeoz (Infobip), el editor SMS muestra la opción "Selección manual" y deja enviar a 1 contacto específico con éxito.
- [ ] CA-2: Email sigue funcionando igual (regresión).
- [ ] CA-3: WhatsApp tiene el mismo comportamiento que SMS.
- [ ] CA-4: Tests nuevos + existentes pasan (`pnpm vitest run comunicaciones`).
- [ ] CA-5: Migration 074 aplicada en prod.
- [ ] CA-6: Build de Vercel verde en stg + prod.

## Out of scope

- Paginar o virtualizar el `ContactPicker` (ya está limitado por el search API).
- CSV upload / bulk paste de números (sería otra iteración).
- Previsualización del mensaje personalizado para cada contacto manual.
- Permitir mezclar "segmento + manual" en una misma campaña.

## Notas

- El componente `ContactPicker` vive en `email-builder/` pero su lógica no es email-específica. Queda en su sitio actual (mover a `components/dashboard/` sería un refactor innecesario; se puede hacer después si crece el reuso).
- La API pública (`/api/agents/...`, etc.) no cambia.
- No se añade lógica al server-side para "si `recipient_ids` y `segment_id` existen, ambos aplican": la regla es **`recipient_ids` gana siempre** (mismo patrón que email, para evitar ambigüedad).

## Incidente encontrado durante la implementación (2026-04-24)

Al intentar aplicar la migration 074 en prod descubrí que las tablas `sms_campaigns`, `whatsapp_campaigns`, `whatsapp_conversations` y `whatsapp_chatbot_config` **no existían** en la DB, aunque las migrations 008 y 022 figuraban como aplicadas en el tracker. Presumiblemente fueron dropeadas manualmente desde el dashboard en algún momento pasado; SMS y WhatsApp estaban efectivamente rotos en prod desde entonces (cualquier "Guardar borrador" fallaba con 500 silencioso).

**Decisión (Alexander, opción A):** ampliar la migration 074 para recrear las 4 tablas ausentes con el mismo DDL de las migrations originales (más la columna `recipient_ids`). La migration es idempotente (`CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS` antes de crear policies), así que no rompe entornos donde las tablas sí existan.

Efecto colateral positivo: este PR no solo añade la selección manual, sino que **restaura SMS y WhatsApp en producción**.
