# Notificación al agregar usuario existente al equipo (multi-tenant)

**Fecha:** 2026-05-02
**Estado:** Aprobada
**Autor:** CTO (Claude)
**Aprobado por:** PM (Alexander)

---

## Problema / Necesidad

PR #8 cerró el bloqueo legacy "ya pertenece a otra organización" insertando una fila en `tenant_users` cuando el invitado es un usuario que ya existe en `auth.users`. Pero quedaron dos huecos:

1. El path multi-tenant **no envía email**. La UI igual muestra el toast "Recibirá un email de acceso" → engaña al super_admin que invita.
2. `inviteTeamMember` (formulario "Nuevo miembro" en Equipo) **no recibió el fix multi-tenant** — para usuarios existentes falla en silencio (cero filas, cero email).

## Solución propuesta

- **Email transaccional nuevo: "Has sido agregado a {tenant}"** — sin token, sin signup. Solo informativo. Se envía solo cuando el invitado ya existía en auth.
- **Aplicar el mismo fallback multi-tenant a `inviteTeamMember`** que `promoteContactToMember` ya tiene.
- **Branch en el toast UI** según si el usuario ya existía o si fue invitado nuevo.
- Los actions devuelven `{ ok, existing_user, email_failed? }` para que la UI hable verdad.

## Requisitos funcionales

- [ ] **RF-1**: Cuando `promoteContactToMember` toma el path "ya registrado" e inserta en `tenant_users`, envía un email "Tienes acceso a {tenant}" al invitado.
- [ ] **RF-2**: Cuando `inviteTeamMember` recibe la misma señal "already been registered", aplica el mismo fallback (insert/update tenant_users + envío del email nuevo).
- [ ] **RF-3**: El email solo se envía la **primera vez** que el usuario es agregado al tenant. Si la membresía ya existía (caso "ya estaba en este tenant, solo actualizamos rol/campañas"), NO se envía (no hay info nueva).
- [ ] **RF-4**: Los actions devuelven `{ ok: true, existing_user: boolean, email_failed?: boolean }`. Errores de email NO hacen rollback de la membresía.
- [ ] **RF-5**: La UI muestra toasts diferenciados:
  - Nuevo en CivicOS: "fue invitado, recibirá email para crear cuenta"
  - Existente, primera vez en este tenant: "ya tenía cuenta, lo agregamos al equipo y le notificamos"
  - Existente, ya estaba en este tenant: "ya está en tu equipo, actualizamos rol/campañas"
  - Email failed: "agregado, pero no pudimos enviar la notificación"

## Diseño técnico

### Archivos a crear

| Archivo | Propósito |
|---|---|
| `apps/web/lib/email/templates/access-granted-email.tsx` | Template React-Email "Tienes acceso a {tenant}". Reusa `EmailLayout/Heading/Paragraph/Button/FallbackLink` de `_components.tsx`. |

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `apps/web/lib/email/transactional.ts` | Export `sendAccessGrantedEmail({ to, inviteeName, inviterName, tenantName, role, campaignNames })`. Usa `getNotificationsFrom()` (no es invite, es notification). |
| `apps/web/app/dashboard/team/actions.ts` | (a) Refactor de la rama existing-user de `promoteContactToMember` para enviar el nuevo email cuando se hace INSERT (no en UPDATE), devolver `{ ok, existing_user: true, email_failed? }`. (b) Aplicar el mismo bloque multi-tenant fallback + email a `inviteTeamMember`. (c) Hacer que `promoteContactToMember` resuelva `tenantName` del tenant target para pasarlo al email. |
| `apps/web/components/dashboard/contacts/PromoteToMemberButton.tsx` | Toast diferenciado según `result.existing_user` y `result.email_failed`. Recibir `tenantName` como prop si es necesario para el copy (o cargarlo desde el server). |
| `apps/web/components/settings/InviteMemberModal.tsx` | Mismo branching de toast. |
| `apps/web/__tests__/team/invite-member.test.ts` | Nuevos tests: (a) `promoteContactToMember` existing user new in tenant → llama `sendAccessGrantedEmail`, retorna `existing_user: true`. (b) `promoteContactToMember` existing user already in tenant → NO llama email, retorna `existing_user: true`. (c) `inviteTeamMember` existing user → fallback a tenant_users + email. (d) Nuevo usuario → flow legacy intacto. (e) Email send falla → action retorna `email_failed: true` pero membresía persiste. |

### API / Data model

**Sin migrations.** Solo cambia el contrato de los server actions y se agrega un envío de email opcional.

**Nuevo helper:**

```ts
export interface SendAccessGrantedParams {
  to: string
  inviteeName: string
  inviterName: string
  tenantName: string
  role: InviteRole
  campaignNames: string[]
}

export async function sendAccessGrantedEmail(
  params: SendAccessGrantedParams
): Promise<SendResult>
```

**Subject:** `Tienes acceso a ${tenantName} en CivicOS`
**From:** `getNotificationsFrom()` (i.e. `noreply@scrutix.co`).
**CTA:** `Abrir CivicOS` → `${appUrl}/dashboard`.

**Nuevo contrato de actions:**

```ts
type ActionResult = { ok?: true; error?: string; existing_user?: boolean; email_failed?: boolean }

promoteContactToMember(contactId, role): Promise<ActionResult>
inviteTeamMember(formData): Promise<void>  // sigue retornando void; redirige
```

`inviteTeamMember` no puede cambiar a retornar un objeto sin tocar la firma del form action, así que mantiene `void`. El toast del modal lee del state local del cliente (Resend success vs. server existing_user via callback opcional). Para mantener la firma simple: hacemos que `inviteTeamMember` devuelva un objeto cuando hay error/info importante; el modal client usa `useTransition` o llamadas RPC directas.

**Decisión simplificadora:** convertir `inviteTeamMember` a una función que devuelve `Promise<ActionResult>` (igual que `promoteContactToMember`) y dejar que el modal maneje el redirect cliente-side. Más uniforme.

## Edge cases

| Caso | Comportamiento |
|---|---|
| RESEND_API_KEY no configurado | `sendAccessGrantedEmail` retorna `{ ok: false, error: 'Email service not configured' }`. Action retorna `email_failed: true` pero NO hace rollback. |
| Usuario existente, ya miembro del tenant target | UPDATE rol + merge campaigns. **No email.** Toast: "ya está en tu equipo, actualizamos rol/campañas." |
| Usuario nuevo (no existe en auth.users) | Path original sin cambios. Toast: "fue invitado, recibirá email para crear cuenta." |
| Tenant target sin nombre (corner case impossible si DB consistente) | Email cae con string vacío en el subject. Aceptable. |
| Email falla pero `tenant_users` ya insertado | Retornar `email_failed: true`. La membresía persiste — es lo importante. Toast: "agregado al equipo, pero no pudimos enviar la notificación. Avísale al usuario manualmente." |
| Multiple campaigns en el role | Listar nombres separados por coma en el email. Si `campaignNames.length === 0`, omitir el bloque "Campañas:". |
| Inviter sin `full_name` | Fallback a "Tu equipo en CivicOS". |

## Criterios de aceptación

- [ ] CA-1: PM agrega contacto Alexander Ortiz desde la cuenta de Jeoz → toast: "Alexander Ortiz ya tenía cuenta. Lo agregamos al equipo de Jeoz y le enviamos una notificación."
- [ ] CA-2: alexor87@gmail.com recibe email con asunto "Tienes acceso a Jeoz en CivicOS", cuerpo identifica a Juan Esteban como inviter y al rol asignado, CTA lleva a `/dashboard`.
- [ ] CA-3: PM agrega un email NUEVO (no existe en auth.users) → toast: "fue invitado al equipo. Recibirá un email para crear su cuenta." (path legacy intacto).
- [ ] CA-4: PM agrega un usuario que ya está en el tenant actual → toast: "ya está en tu equipo, actualizamos su rol y campañas." NO se envía email.
- [ ] CA-5: Si Resend está down/mal configurado, la membresía igual se crea + toast indica error de email.
- [ ] CA-6: Suite de tests pasa (`pnpm test __tests__/team/`).
- [ ] CA-7: Build limpio (`pnpm build`).

## Out of scope

- Bug de impersonación en `promoteContactToMember` (usa `profile.tenant_id` home en lugar del activo). Spec separada.
- Notificación in-app (campanita) — el email + el dot azul "Nuevo" en switcher cubren descubrimiento.
- "Salirme de este tenant" desde UI del usuario invitado.
- Configurar dominio Resend custom por tenant (`resend_domain` ya soportado para campañas, pero el email "access granted" usa el dominio default `noreply@scrutix.co` por simplicidad — es notificación de sistema, no email de campaña).

## Notas

- El email de "access granted" NO incluye token mágico ni botón "aceptar invitación". El usuario ya tiene cuenta y password — solo abre el dashboard normalmente y verá el nuevo tenant en su switcher (PR #10).
- El `from` es `noreply@scrutix.co` (notifications), no `invitaciones@scrutix.co` (invites). Diferencia semántica importante para inbox placement y unsubscribe expectations.
- TDD per CLAUDE.md: tests rojos primero, luego implementación.

## Estimación

~1 día. La complejidad real está en sincronizar UI/server contract para `existing_user` y `email_failed`, y en mantener el flujo de `inviteTeamMember` (form action) consistente con `promoteContactToMember` (RPC-style action).
