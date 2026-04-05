# Scrutix — Referencia de Desarrollo

> **LECTURA OBLIGATORIA antes de desarrollar cualquier feature, página, componente, agente o migración.**
> Consulta siempre el PRD y este documento antes de escribir una sola línea de código.

---

## 1. Documentos fuente

| Documento | Ruta | Cuándo consultarlo |
|---|---|---|
| **PRD v2.0** | [`CivicOS_PRD_v2.0.md`](./CivicOS_PRD_v2.0.md) | Antes de cualquier feature: qué construir, por qué y para quién |
| **Instrucciones Claude** | [`../CLAUDE.md`](../CLAUDE.md) | Reglas de UI, design system, permisos de ejecución |
| **Este archivo** | [`DEV_REFERENCE.md`](./DEV_REFERENCE.md) | Planning, estado actual y checklist de desarrollo |

---

## 2. Arquitectura del proyecto

```
civicos/
├── apps/
│   └── web/                  # Next.js 16 + TypeScript
│       ├── app/              # App Router (layouts, pages, API routes)
│       ├── components/       # Componentes propios de Scrutix
│       ├── components/ui/    # Componentes shadcn/ui (no editar manualmente)
│       └── lib/              # Supabase client, utils, types
├── supabase/
│   ├── migrations/           # SQL versionado (Supabase CLI)
│   └── functions/            # Edge Functions (Deno/TypeScript)
├── packages/                 # Shared packages del monorepo
├── CLAUDE.md                 # (raíz del repo, fuera de civicos/)
└── DEV_REFERENCE.md          # Este archivo
```

### Stack obligatorio

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Next.js 16 (App Router) |
| Styling | **Tailwind CSS exclusivamente** |
| UI components | **shadcn/ui** — instalar con `npx shadcn@latest add [componente]` |
| Analytics/KPIs | **Tremor** |
| Base de datos | Supabase (PostgreSQL 16 + RLS + PostGIS + pgvector) |
| Auth | Supabase Auth con custom JWT claims |
| Realtime | Supabase Realtime (Phoenix Channels) |
| Edge Functions | Supabase Edge Functions (Deno/TypeScript) |
| IA / LLM | Anthropic Claude (`claude-sonnet-4-5`) |
| Package manager | **pnpm 10.x** — nunca npm/yarn |
| Node | v20.20.1 via nvm — siempre `. ~/.nvm/nvm.sh` primero |

---

## 3. Modelo de datos — tablas principales

> Toda tabla tiene `tenant_id UUID NOT NULL` con política RLS activa. **Nunca omitir.**

| Tabla | Propósito |
|---|---|
| `tenants` | Tenant raíz; facturación y plan SaaS |
| `campaigns` | Procesos electorales dentro de un tenant |
| `contacts` | CRM — perfil unificado del votante (`geo POINT`, `embedding VECTOR`) |
| `users` | Usuarios gestionados por Supabase Auth |
| `canvass_visits` | Registros de terreno, offline-first |
| `communications` | Emails, SMS, WhatsApp enviados |
| `ai_suggestions` | Sugerencias del motor IA (`pending_approval` / `active` / `dismissed`) |
| `agent_runs` | Log de ejecuciones de agentes con steps auditables |

### RLS — patrón obligatorio

```sql
-- Todas las políticas siguen este patrón:
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
```

---

## 4. Roles y permisos

| Rol | Alcance |
|---|---|
| `super_admin` | Organización completa |
| `campaign_manager` | Campaña asignada — CRUD completo |
| `field_coordinator` | Equipo(s) asignado(s) |
| `volunteer` | Actividades asignadas + chatbot IA |
| `analyst` | Read-only + exportar + sugerencias IA |
| `custom` | Configurable por Campaign Manager |

Los roles se inyectan como custom claims en el JWT durante el login (`enrich-jwt` Edge Function).

---

## 5. Agentes IA — catálogo

| # | Agente | Trigger | Estado |
|---|---|---|---|
| 1 | Bienvenida y calificación de contactos | Nuevo contacto en CRM | ✅ Implementado |
| 2 | Seguimiento de canvassing | Visita "no en casa" o "requiere seguimiento" | ✅ Implementado |
| 3 | Comunicaciones inteligentes | Inicio de campaña o caída de engagement | Pendiente Fase 2 |
| 4 | Análisis de terreno y redistribución | Nightly o cobertura < umbral | Pendiente Fase 2 |
| 5 | Monitoreo de indicadores | Diario via `pg_cron` + alerta >20% caída | Pendiente Fase 2 |
| 6 | Generación de contenido | Solicitud explícita desde UI | Pendiente Fase 3 |

**Patrón HITL obligatorio** para acciones irreversibles:
1. Agente genera propuesta → `ai_suggestions` con `status: pending_approval`
2. UI notifica al usuario
3. Usuario aprueba/rechaza/edita
4. Si aprueba → agente ejecuta → log en `agent_runs`

---

## 6. Estado actual del MVP (Fase 1)

### Completado ✅
- [x] Monorepo scaffolded (pnpm workspaces)
- [x] Migrations SQL: `001_init` + `002_rls`
- [x] Auth + middleware + Edge Function `enrich-jwt`
- [x] Onboarding API route
- [x] Dashboard KPIs
- [x] CRM Contacts (lista + importación CSV)
- [x] Canvassing page
- [x] AI Center (sugerencias + HITL)
- [x] Agente 1 — Bienvenida de contactos (Edge Function)
- [x] Agente 2 — Seguimiento de canvassing (Edge Function)

### Pendiente Fase 1
- [ ] Build limpio sin errores TypeScript
- [ ] Tests de penetración RLS (zero data leakage entre tenants)
- [ ] App móvil KMM — scaffolding inicial

### Fase 2 (siguiente)
- [ ] Email + SMS (SendGrid + Twilio)
- [ ] Mapas con PostGIS + Mapbox
- [ ] Gestión de voluntarios
- [ ] Dashboard Realtime
- [ ] Motor de Sugerencias IA v1 — Agentes 3 y 4
- [ ] Centro de Inteligencia (UI)

---

## 7. Checklist antes de desarrollar

Antes de empezar cualquier tarea, responde estas preguntas:

1. **¿Está en el PRD?** Si no está en [`CivicOS_PRD_v2.0.md`](./CivicOS_PRD_v2.0.md), no lo construyas sin confirmación.
2. **¿A qué fase pertenece?** No adelantar funcionalidades de fases futuras sin instrucción explícita.
3. **¿Afecta la DB?** Si sí → crear migration con `supabase migration new [nombre]`, nunca editar tablas directamente.
4. **¿La tabla nueva tiene `tenant_id` + política RLS?** Obligatorio en toda tabla.
5. **¿Usas un componente UI?** Primero busca en shadcn/ui. Si existe, instálalo con `npx shadcn@latest add`.
6. **¿Es una acción irreversible del agente?** Implementar flujo HITL completo.
7. **¿Hay lógica serverless?** Va en Supabase Edge Function, no en API routes de Next.js si puede evitarse.

---

## 8. Comandos frecuentes

```bash
# Entorno
. ~/.nvm/nvm.sh

# Desarrollo
pnpm dev                          # Levanta apps/web en localhost:3000
pnpm build                        # Build de producción

# Supabase
supabase start                    # Emulator local
supabase migration new [nombre]   # Nueva migración
supabase db push                  # Aplicar migraciones
supabase functions serve          # Edge Functions en local
supabase gen types typescript --local > apps/web/lib/database.types.ts

# Instalar componente shadcn
npx shadcn@latest add [componente]
```

---

## 9. Criterios de éxito MVP (Fase 1)

- Onboarding de una organización en < 10 minutos sin asistencia
- Importación de 10,000 contactos en < 2 minutos
- Canvassing offline funcional por al menos 24 horas
- Dashboard carga en < 2 segundos (p95)
- **Zero data leakage entre tenants** (validado con pen tests)

---

*Última actualización: Marzo 2026 — sincronizar con el PRD ante cualquier cambio de alcance.*
