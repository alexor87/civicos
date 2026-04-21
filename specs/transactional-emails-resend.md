# Emails transaccionales con Resend

**Fecha:** 2026-04-20
**Estado:** Completada
**Autor:** CTO (Claude)
**Aprobado por:** PM (Usuario)

---

## Problema / Necesidad

Hoy los emails transaccionales de la plataforma (invitaciones a equipo, invitaciones a voluntarios, recuperación de contraseña) se envían a través del sistema built-in de Supabase Auth. Esto trae dos problemas reales:

1. **Links rotos en producción:** el link embebido apunta a `localhost` porque la configuración del Site URL de Supabase está desalineada con producción. Un voluntario recibe el email y no puede acceder.
2. **Emails sin identidad de marca:** llegan con el remitente y el template genérico de Supabase, no con branding Scrutix. Se ven poco profesionales y bajan la tasa de conversión de invitaciones.

Por otro lado, ya tenemos cuenta de Resend funcionando con el dominio `scrutix.co` (usada hoy solo para emails de verificación y campañas de marketing). La infraestructura existe, falta extenderla.

## Solución propuesta

Migrar **todos los emails transaccionales internos** de la plataforma a un único servicio centralizado basado en Resend + React Email, con templates propios en español y branding Scrutix.

**Qué ve el usuario:**
- Un voluntario invitado recibe un email desde `Scrutix <invitaciones@scrutix.co>`, con el logo y colores de la plataforma, el texto en español, y un link que funciona en producción.
- El Product Manager al invitar no percibe cambio: el flujo desde la UI es idéntico, solo cambia el backend del envío.

**Qué cambia por dentro:**
- En vez de `admin.auth.admin.inviteUserByEmail()` (que manda el email desde Supabase), usamos `admin.auth.admin.generateLink({ type: 'invite' })` (que solo genera el token sin enviar) + `resend.emails.send()` con nuestro template.
- Supabase sigue siendo la fuente de verdad de auth (usuario creado, token válido, expiración, RLS). Resend solo transporta el email.

## Requisitos funcionales

- [x] RF-1: Al invitar a un contacto como voluntario desde el módulo de Team, se envía un email vía Resend con template Scrutix y link a producción.
- [x] RF-2: Al invitar a un miembro del equipo (field_coordinator, analyst, comms_coordinator, volunteer), se envía el mismo tipo de email.
- [x] RF-3: El email incluye: nombre del invitado, nombre de quien invita, nombre de la campaña, rol asignado, botón CTA "Aceptar invitación", link alternativo en texto plano, pie con "Si no esperabas este email, ignóralo".
- [x] RF-4: Template y servicio listos para recuperación de contraseña. Nota: no existe un flujo de reset password en la UI hoy; cuando se construya usará `sendPasswordResetEmail` de `lib/email/transactional.ts`.
- [x] RF-5: El remitente por defecto es `Scrutix <invitaciones@scrutix.co>` para invitaciones y `Scrutix <noreply@scrutix.co>` para notificaciones de cuenta. Configurable por env var.
- [x] RF-6: Si Resend falla, el error queda registrado (`console.error` + return structured error) y el endpoint devuelve mensaje claro al usuario.
- [x] RF-7: Los links siempre usan `NEXT_PUBLIC_APP_URL` como base, nunca el Site URL de Supabase.

## Diseño técnico

### Arquitectura

```
┌─────────────────────┐
│  UI: invitar team   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────┐
│ API Route / Server Action        │
│ 1. Validar permisos              │
│ 2. admin.generateLink(invite)    │  ← Supabase genera token, NO envía email
│ 3. sendTransactionalEmail(...)   │  ← Nuestro wrapper
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ lib/email/transactional.ts       │
│  - renderInviteEmail(props)      │  ← React Email → HTML
│  - send via Resend SDK           │
└─────────────────────────────────┘
```

### Archivos a crear

| Archivo | Propósito |
|---------|-----------|
| `apps/web/lib/email/transactional.ts` | Servicio central de envío transaccional. Exporta `sendInviteEmail`, `sendPasswordResetEmail`. Maneja API key, from address, logging de errores. |
| `apps/web/lib/email/templates/invite-email.tsx` | Template React Email para invitación a equipo/voluntario. Recibe `{ inviteeName, inviterName, campaignName, role, actionLink }`. |
| `apps/web/lib/email/templates/password-reset-email.tsx` | Template React Email para reset de password. Recibe `{ userName, actionLink }`. |
| `apps/web/lib/email/templates/_components.tsx` | Componentes compartidos: `<EmailLayout>`, `<EmailButton>`, `<EmailFooter>`. Asegura consistencia visual entre todos los templates. |
| `apps/web/__tests__/lib/email/transactional.test.ts` | Unit tests: valida que se invoca Resend con los params correctos, que se genera el link con `NEXT_PUBLIC_APP_URL`, que el error de Resend se maneja. |
| `apps/web/__tests__/lib/email/templates/invite-email.test.tsx` | Render tests del template: incluye nombre, rol, link, botón CTA. |

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `apps/web/app/api/team/invite/route.ts` | Reemplazar `inviteUserByEmail` por `generateLink({ type: 'invite' })` + `sendInviteEmail`. Rollback si Resend falla (ver RF-6). |
| `apps/web/app/dashboard/team/actions.ts` | Mismo cambio en `inviteTeamMember` y `promoteContactToMember`. |
| `apps/web/lib/email/send-verification-email.ts` | Refactor para usar el nuevo template layout y el wrapper centralizado. Mantiene comportamiento. |
| `apps/web/package.json` | Agregar dependencias: `@react-email/components`, `react-email` (devDep para preview local). |
| `.env.example` | Documentar `EMAIL_FROM_INVITES`, `EMAIL_FROM_NOTIFICATIONS`, `NEXT_PUBLIC_APP_URL`. |

### API / Data model

**Sin cambios en DB.** No se crean tablas nuevas, no hay migraciones.

**Env vars requeridas en producción (Vercel):**
- `RESEND_API_KEY` — ya existe
- `NEXT_PUBLIC_APP_URL=https://app.scrutix.co` — verificar
- `EMAIL_FROM_INVITES=Scrutix <invitaciones@scrutix.co>` — nueva
- `EMAIL_FROM_NOTIFICATIONS=Scrutix <noreply@scrutix.co>` — nueva

**Configuración Supabase Dashboard (una sola vez):**
- Authentication → URL Configuration → Site URL = `https://app.scrutix.co`
- Authentication → URL Configuration → Redirect URLs: agregar `https://app.scrutix.co/**`
- Authentication → Email Templates → **desactivar** emails de "Invite user" y "Reset password" (los reemplazamos). O dejarlos como fallback.

**API del wrapper (TypeScript):**

```ts
// lib/email/transactional.ts
export type SendResult = { ok: true; id: string } | { ok: false; error: string }

export async function sendInviteEmail(params: {
  to: string
  inviteeName: string
  inviterName: string
  campaignName: string
  role: 'field_coordinator' | 'volunteer' | 'analyst' | 'comms_coordinator'
  actionLink: string
}): Promise<SendResult>

export async function sendPasswordResetEmail(params: {
  to: string
  userName: string
  actionLink: string
}): Promise<SendResult>
```

## Edge cases

| Caso | Comportamiento esperado |
|------|------------------------|
| Resend API key no configurada | `console.error`, endpoint devuelve 500 con mensaje claro "Email service not configured". |
| Resend devuelve error (ej. rate limit, dominio no verificado) | Se registra el error. En invitaciones nuevas: si el usuario de auth ya se creó con `generateLink`, se mantiene (token válido en DB) y el PM puede reenviar manualmente. Se muestra toast "Usuario creado pero el email falló. Puedes reenviar la invitación." |
| Usuario ya existe en auth (caso `promoteContactToMember`) | Mantener lógica actual: si pertenece al mismo tenant, update role/campaigns sin enviar email. Si es otro tenant, error. |
| `generateLink` falla | No se llama a Resend. Error devuelto al usuario. |
| Email con caracteres especiales en nombre (`José Ñúñez`) | Template React Email lo renderiza correctamente (UTF-8 nativo). Tests cubren este caso. |
| `NEXT_PUBLIC_APP_URL` no configurada | Fallback a `https://app.scrutix.co` hardcoded + `console.warn`. No romper producción. |
| Link expirado (el usuario abre el email días después) | Supabase Auth maneja la expiración del token; al hacer click, muestra su pantalla de "invitation expired". Sin cambio por parte nuestra. |

## Criterios de aceptación

- [ ] CA-1: Invitar un voluntario en staging envía email desde `invitaciones@scrutix.co` con link `https://app.scrutix.co/...`, renderizado con branding Scrutix.
- [ ] CA-2: El link del email permite al voluntario aceptar la invitación y crear su password en producción.
- [ ] CA-3: Recuperar password envía email vía Resend, no desde Supabase.
- [ ] CA-4: Si Resend devuelve error, la UI muestra mensaje claro al PM (no falla silenciosa).
- [ ] CA-5: Los templates se ven bien en Gmail, Outlook web, y cliente móvil iOS.
- [ ] CA-6: Todos los tests pasan (`pnpm test`). Cobertura nueva: wrapper de envío + templates.
- [ ] CA-7: Build de producción sin warnings (`pnpm build`).
- [ ] CA-8: Deploy exitoso a Vercel con env vars configuradas.

## Out of scope

Explícitamente **NO** incluido en esta spec:

- **Send Email Hook de Supabase** (webhook bidireccional). Es más sofisticado pero agrega una pieza de infra (endpoint público firmado) que no necesitamos aún. Si en el futuro queremos que los emails de magic link / OTP también pasen por Resend, volvemos a evaluar.
- **Emails de campañas de marketing** (`apps/web/app/dashboard/comunicaciones/`). Ya usan Resend, fuera de scope.
- **Emails de journeys automatizados** (`supabase/functions/journey-runner`). Ya usan Resend, fuera de scope.
- **Preferencias de usuario para desactivar emails** (unsubscribe de transaccionales). Los emails transaccionales son obligatorios por naturaleza; no aplica unsubscribe.
- **Internacionalización (i18n):** templates solo en español. Si se abre a otros mercados, se vuelve a planear.
- **Retries automáticos** si Resend falla. Por ahora reenvío manual desde UI.

## Notas

**Decisión: `generateLink` + Resend vs. Send Email Hook.**
Elegimos `generateLink` porque es más simple (sin webhook público, sin firma HMAC, sin endpoint adicional que mantener) y cubre 100% de lo que necesitamos hoy. El trade-off es que solo funciona para los emails que disparamos explícitamente desde código nuestro (invite, password reset). Si Supabase genera emails por su cuenta (por ejemplo en el flujo de sign-up con email confirmation), esos seguirán saliendo de Supabase — pero hoy no usamos ese flujo, usamos verificación custom.

**Decisión: React Email vs. HTML crudo.**
React Email nos da componentes tipados, preview local con `pnpm email dev`, y compatibilidad probada con Gmail/Outlook. El HTML actual de `send-verification-email.ts` está hardcoded; refactorizar a React Email hace que agregar templates futuros sea trivial.

**Decisión: remitentes separados (`invitaciones@` vs `noreply@`).**
Los correos desde `invitaciones@scrutix.co` tienen mejor apertura que `noreply@` porque la gente percibe que puede responder. Para notificaciones automáticas (reset password, alertas) usamos `noreply@` para ser explícitos.

**Dependencias nuevas:**
- `@react-email/components` (~60KB, runtime)
- `react-email` (devDep, para preview local con `pnpm email dev` en `localhost:3000/emails`)

**Tiempo estimado:** 1 sesión de implementación (~3-4 horas) incluyendo tests.

**Riesgo principal:** deliverability. Si el DNS de `scrutix.co` no tiene SPF/DKIM/DMARC bien configurados, los emails caen en spam. Verificar en Resend Dashboard → Domains que `scrutix.co` esté "Verified" antes de migrar.
