# Multi-tenant switcher (selección unificada de tenant + campaña)

**Fecha:** 2026-05-02
**Estado:** Aprobada
**Autor:** CTO (Claude)
**Aprobado por:** PM (Alexander)

---

## Problema / Necesidad

La infraestructura multi-tenant ya está en producción (`tenant_users`, `profiles.active_tenant_id`, `enrich-jwt` con `tenant_ids[]`) y el flujo "Agregar al equipo" ya soporta agregar un usuario a múltiples tenants (PR #8). Pero **el usuario invitado no tiene cómo navegar al nuevo tenant**: al loguearse cae en su tenant principal (`active_tenant_id` previo) y el switcher actual (header) solo lista campañas dentro de ese tenant.

Resultado hoy: la membresía existe a nivel de datos pero la app es invisible al usuario. Necesitamos cerrar el loop con UX para que un usuario con N tenants y M campañas por tenant pueda seleccionar dónde quiere trabajar.

## Solución propuesta

**Un solo control en el header — el dropdown actual de campañas — extendido para listar campañas de TODOS los tenants donde el usuario es miembro, agrupadas visualmente por tenant.** Al elegir una campaña de otro tenant, el sistema cambia tenant + campaña activos en una sola transición y refresca el JWT para que RLS scope al tenant nuevo.

Casos:

- **1 tenant, N campañas** → idéntico a hoy (header muestra campañas del tenant).
- **N tenants, 1 campaña por tenant** → dropdown lista N campañas, agrupadas por tenant. Click cambia tenant + campaña.
- **N tenants, M campañas** → dropdown agrupa por tenant con cabeceras. Click cambia tenant + campaña.

**Login:** sin pantalla de selección. El usuario aterriza en el último tenant/campaña que usó (`active_tenant_id` + cookie `active_campaign_id`). Si la cookie está stale (campaña ya no le pertenece), cae en la primera campaña válida del tenant activo.

**Recién invitado a un tenant nuevo:** la próxima vez que abra el dropdown verá el nuevo tenant listado con un badge "Nuevo" sutil durante 7 días. No hay popup ni notificación por email en este alcance — el descubrimiento es vía el switcher.

## Requisitos funcionales

- [ ] **RF-1**: Si el usuario tiene 2+ tenants en `tenant_users`, el dropdown del header muestra todas las campañas accesibles, agrupadas por nombre del tenant.
- [ ] **RF-2**: Si el usuario tiene 1 solo tenant, el dropdown se ve y comporta exactamente como hoy (sin agrupamiento, sin headers).
- [ ] **RF-3**: Click en una campaña del tenant actual → comportamiento actual (solo cambia `active_campaign_id`).
- [ ] **RF-4**: Click en una campaña de otro tenant → backend actualiza `profiles.active_tenant_id` + setea cookies `active_campaign_id` y `active_tenant_id`, refresca JWT (vía `supabase.auth.refreshSession()` cliente-side tras la respuesta), redirige a `/dashboard` para que el layout re-render con el nuevo scope.
- [ ] **RF-5**: Login después de impersonación, signup nuevo, o signup pre-multi-tenant: aterrizaje sin fricción usando `active_tenant_id` ya hidratado por `enrich-jwt`.
- [ ] **RF-6**: Una campaña recién accesible (porque el usuario fue invitado a un tenant nuevo en los últimos 7 días) muestra un dot/badge "Nuevo" en el dropdown. Se calcula con `tenant_users.created_at`.
- [ ] **RF-7**: El endpoint `/api/campaigns/switch` valida que la campaña pertenezca a un tenant donde el usuario es miembro (vía `tenant_users`), no solo a `profile.campaign_ids`.

## Diseño técnico

### Archivos a crear

Ninguno. Toda la implementación reusa archivos existentes.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `apps/web/app/dashboard/layout.tsx` | Reemplazar fetch de campañas (`in('id', campaignIds)`, ~línea 55-57) por un join `tenant_users` → `campaigns` que traiga todas las campañas de los tenants donde el user es miembro. Pasar al header como `campaigns: { id, name, tenant_id, tenant_name, is_new_tenant }[]`. |
| `apps/web/app/api/campaigns/switch/route.ts` | (1) Validar membresía vía `tenant_users` en lugar de `profiles.campaign_ids`. (2) Si la campaña pertenece a un tenant ≠ al activo actual: actualizar `profiles.active_tenant_id`, setear cookie `active_tenant_id`, devolver flag `tenant_changed: true` en la respuesta. |
| `apps/web/components/dashboard/DashboardHeader.tsx` | (1) Agrupar el render del dropdown por `tenant_name` cuando hay 2+ tenants distintos. (2) En `switchCampaign`, si la respuesta trae `tenant_changed: true`: llamar `supabase.auth.refreshSession()` antes de hacer `router.refresh()`/redirect. (3) Mostrar dot azul junto a campañas con `is_new_tenant: true`. |
| `apps/web/lib/supabase/client.ts` _(si no expone helper de refresh)_ | Asegurar que el cliente browser pueda llamar `refreshSession()` tras el switch. |

### API / Data model

**Sin migrations nuevas.** Todo el schema necesario ya está en prod:

- `tenant_users(user_id, tenant_id, role, campaign_ids, created_at, ...)` con PK `(user_id, tenant_id)`.
- `profiles.active_tenant_id` ya existe como FK nullable a `tenants`.
- `enrich-jwt` ya lee `profiles.active_tenant_id` y lo emite como claim `tenant_id` (que `auth_tenant_id()` consume para RLS).

**Nuevo query del layout** (reemplaza el actual):

```ts
const { data: tenantMemberships } = await supabase
  .from('tenant_users')
  .select(`
    tenant_id,
    campaign_ids,
    created_at,
    tenants!tenant_users_tenant_id_fkey ( id, name ),
    campaigns:campaigns!campaigns_tenant_id_fkey ( id, name, tenant_id )
  `)
  .eq('user_id', user.id)
```

Filtrado del lado servidor: para cada membership, intersectar `campaign_ids` con `campaigns.id` para devolver solo las campañas a las que el user efectivamente tiene acceso (no todas las del tenant).

Marca `is_new_tenant`: `tenant_users.created_at >= now() - interval '7 days' AND tenant_id ≠ tenant principal del user`.

**Nuevo contrato del endpoint `/api/campaigns/switch`:**

Request: `{ campaignId: string }`
Response success: `{ ok: true, tenant_changed: boolean, tenant_id: string }`
Response error: `{ error: string }` con status 403 si la campaña no es accesible vía `tenant_users`.

**Política RLS relevante** (ya existe, no cambia):
- `tenant_users_select_own` (`user_id = auth.uid()`) permite que el user lea sus propias membresías para construir el dropdown.

### Refresh del JWT cliente-side

Cuando el endpoint responde `tenant_changed: true`:

```ts
// DashboardHeader.tsx — switchCampaign
const res = await fetch('/api/campaigns/switch', { ... })
const json = await res.json()
if (json.tenant_changed) {
  const { createBrowserClient } = await import('@/lib/supabase/client')
  await createBrowserClient().auth.refreshSession()
}
window.location.href = '/dashboard'  // hard refresh para re-correr layout con JWT nuevo
```

`refreshSession()` dispara el auth hook que vuelve a invocar `enrich-jwt`, el cual lee el nuevo `active_tenant_id` de `profiles` y emite un JWT con el `tenant_id` actualizado. RLS pasa a scope al tenant nuevo a partir de la siguiente request.

## Edge cases

| Caso | Comportamiento esperado |
|---|---|
| User tiene 1 tenant con 1 campaña | Header sin dropdown (igual que hoy). |
| User tiene 1 tenant con N campañas | Dropdown estándar, sin agrupamiento por tenant. |
| User tiene N tenants, una con 0 campañas accesibles | El tenant aparece como header pero con un sub-item "Sin campañas accesibles" deshabilitado. Elegirlo no hace nada. |
| Cookie `active_campaign_id` apunta a una campaña que el user perdió (ej. removido del tenant) | Layout detecta y cae en la primera campaña válida del tenant activo. Si el tenant tampoco es válido, fallback a primer tenant de `tenant_users`. |
| User es removido de un tenant mientras tiene la sesión abierta en él | RLS empieza a bloquear los queries → 401/403. El siguiente render del layout detecta que su `active_tenant_id` ya no está en `tenant_users` y cae al primer tenant válido. Si no le quedan tenants, signOut + `/login?error=no-access`. |
| User cambia de tenant pero el JWT nuevo tarda en propagar | Hard refresh tras `refreshSession()` garantiza que el siguiente paint usa el JWT nuevo. Mientras tanto el browser ve loading state. |
| User es super_admin de tenant A pero solo `field_coordinator` en tenant B | El switcher lo deja cambiar normalmente. Su rol efectivo cambia con el tenant (lo lee `enrich-jwt` desde `tenant_users.role`). El sidebar y permisos se ajustan automáticamente al re-render. |
| Impersonación activa | El switcher se oculta durante impersonación (el banner naranja ya bloquea la mayoría de acciones críticas). Se reactiva al cerrar la sesión impersonada. |
| User entra al dashboard en una URL profunda (ej. `/dashboard/contacts/abc`) y su `active_tenant_id` no contiene esa campaña/contacto | RLS bloquea, página muestra "No encontrado". User usa el switcher en el header para cambiar. No hay redirect mágico cross-tenant. |
| 2 sesiones del mismo user en pestañas distintas, una cambia tenant | La otra pestaña sigue con su JWT viejo hasta que haga una request que dispare refresh, o se recargue. Aceptado — no es un escenario común y arreglarlo requiere broadcast (out of scope). |

## Criterios de aceptación

- [ ] **CA-1**: Como user con 2 tenants, abro el header y veo dos secciones con headers de tenant en el dropdown.
- [ ] **CA-2**: Click en campaña del tenant B → la URL recarga, el sidebar muestra "Tenant B" + nombre de la campaña, y un query SQL muestra `profiles.active_tenant_id = tenant_B`.
- [ ] **CA-3**: Tras el switch, queries de la app (contactos, eventos, etc.) solo devuelven datos del tenant B (RLS efectivo).
- [ ] **CA-4**: User invitado a un tenant en las últimas 24h ve el dot "Nuevo" en el dropdown junto a las campañas de ese tenant.
- [ ] **CA-5**: User con 1 tenant ve el dropdown idéntico a hoy (sin agrupamiento, sin headers, sin dots).
- [ ] **CA-6**: Endpoint `/api/campaigns/switch` rechaza con 403 si la campaña no pertenece a ningún tenant donde el user es miembro.
- [ ] **CA-7**: Tests unitarios cubriendo: dropdown agrupado, switch intra-tenant, switch cross-tenant, validación de membresía rechazada.
- [ ] **CA-8**: Todos los tests pasan (`pnpm test`).
- [ ] **CA-9**: Deploy exitoso a producción y prueba E2E con `alexor87@gmail.com` (verificar que después de PR #8 + esta spec, puede saltar entre `Direct Test` y el segundo tenant).

## Out of scope

- **Pantalla de selección de tenant al login.** No la consideramos necesaria — el `active_tenant_id` sticky es suficiente y el dropdown está siempre disponible. Si en el futuro hay usuarios con 5+ tenants podemos reconsiderar.
- **Notificación email/push al ser invitado a tenant nuevo.** El badge "Nuevo" en el dropdown es la única señal en este alcance.
- **Sincronización en tiempo real entre pestañas** cuando un user cambia tenant en una pestaña. La pestaña stale sigue con JWT viejo hasta refresh natural.
- **Cambiar el "tenant principal"** (`profiles.tenant_id`). Esa columna se preserva como el "home tenant" inmutable creado en signup; el `active_tenant_id` es lo que el user controla.
- **Permitir a un user salirse de un tenant ("leave tenant")** desde la UI. Si lo necesita, pasa por un super_admin de ese tenant que lo remueva. Spec separada si surge la necesidad.
- **Tenant switcher para impersonación.** Hoy la impersonación se hace desde admin tools — fuera de este flujo.

## Notas

### Por qué unificar tenant + campaña en un solo control

- El usuario nunca opera "en un tenant abstracto" — siempre opera en una campaña específica que pertenece a un tenant. Forzar dos controles separados (un tenant switcher + un campaign switcher) duplica el modelo mental.
- El cookie `active_campaign_id` ya implica un tenant indirectamente (por la FK `campaigns.tenant_id`) — la unificación hace explícito lo que ya estaba implícito.
- Reusa endpoint, componente, tests y comportamiento ya probados.

### Refresh del JWT — alternativas evaluadas

1. **Reload completo (`window.location.href = '/dashboard'`)** ← elegido. Más simple, predecible, sin estado intermedio.
2. `router.refresh()` de Next.js — más rápido pero deja state cliente-side stale (zustand/context con datos del tenant viejo). Riesgo de UI inconsistente.
3. Server action que devuelve el JWT directamente — requiere que el cliente lo persista en localStorage manualmente. Más frágil.

### Riesgo: RLS efectivo cambia entre requests

Después de `refreshSession()` el JWT nuevo entra en vigor. Cualquier request en flight con el JWT viejo ya retornó. El hard reload garantiza que la próxima ola de requests usa el nuevo.

### Trigger `fn_sync_profile_to_tenant_user`

El trigger sincroniza cambios de `profiles.role` a `tenant_users.role` para el `active_tenant_id`. Cambiar `active_tenant_id` no dispara cambios de role — solo cambia qué fila del tenant_users es la "activa" para el JWT. Comportamiento correcto.

### Estimación

~1.5 días de trabajo (1 layout + 1 endpoint + 1 component + tests). Riesgo: medio (toca RLS effective scope, pero todo dentro de feature flags ya probados).

### Plan de rollout

1. Implementar tras aprobación de esta spec.
2. PR a `main` con todos los cambios + tests.
3. Verificación en prod con `alexor87@gmail.com` ya membresía en 2 tenants (post-PR #8).
4. Si surgiera regresión: revertir es cambiar 3 archivos al estado previo. Sin migraciones.

### Dependencias

- **PR #8 (multi-tenant team add) mergeado y desplegado** — necesario para que existan users con N membresías para probar.
- Migration 075 ya en prod (verificado).
- `enrich-jwt` ya en prod con `active_tenant_id` claim (verificado).
