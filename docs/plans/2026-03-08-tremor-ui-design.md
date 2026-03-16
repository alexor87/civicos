# CivicOS — Diseño UI Profesional con Tremor

**Fecha:** 2026-03-08
**Estado:** Aprobado por PM
**Alcance:** Sidebar + Dashboard + Canvassing + Centro IA

---

## Objetivo

Elevar la calidad visual de CivicOS al nivel de una herramienta SaaS enterprise, cumpliendo el design system definido en CLAUDE.md: shadcn/ui para estructura, Tremor para analítica.

---

## Componentes afectados

### 1. Sidebar (`components/dashboard/Sidebar.tsx`)
- Fondo `slate-900` (oscuro)
- Header: logo CivicOS + nombre de organización + campaña activa
- Navegación agrupada en secciones: Gestión (Dashboard, Campañas), Operaciones (Contactos, Canvassing), Inteligencia (Equipo, Centro IA)
- Estado activo: fondo `blue-600/20`, texto `blue-400`, borde izquierdo azul
- Hover: `slate-800` suave
- Footer: Avatar con iniciales, nombre completo, badge de rol, botón logout

### 2. Dashboard principal (`app/dashboard/page.tsx`)
- 4 KPI cards → Tremor `<Metric>` con valor, label y delta de tendencia
- `<AreaChart>` de contactos registrados por semana (datos agrupados por fecha)
- Panel sugerencias IA: badges de prioridad con colores Tremor (red/orange/blue/gray)
- Panel actividad agentes: indicadores de estado con colores semánticos

### 3. Canvassing (`app/dashboard/canvassing/page.tsx`)
- 4 stat cards → Tremor `<Metric>`
- `<ProgressBar>` de % visitas aprobadas sobre total
- `<BarList>` con distribución de resultados (Positivo, Negativo, Indeciso, No en casa, Seguimiento, Rechazó)

### 4. Centro de IA (`app/dashboard/ai/page.tsx` + `AISuggestionsPanel.tsx`)
- Badges de prioridad con colores semánticos Tremor
- `<DonutChart>` con proporción activas / aplicadas / descartadas

---

## Lo que NO cambia
- Lógica de datos (queries Supabase)
- Tablas (shadcn/ui `<Table>`)
- Formularios y filtros
- API routes
- Tests existentes

---

## Decisiones técnicas
- Tremor v3 compatible con React 19 via `--legacy-peer-deps` si es necesario
- AreaChart usa datos agrupados en el servidor (no client-side)
- Sidebar sigue siendo Client Component (necesita `usePathname`)
- Todos los nuevos componentes client llevan tests en `__tests__/components/`
