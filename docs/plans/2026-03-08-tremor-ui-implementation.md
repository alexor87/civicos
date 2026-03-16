# Tremor UI + Sidebar Profesional — Plan de Implementación

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrar Tremor para analítica y rediseñar el Sidebar para que CivicOS se vea como una herramienta SaaS enterprise.

**Architecture:** Tremor se instala como librería de componentes de analítica. El Sidebar se reescribe manteniendo su lógica pero con diseño oscuro profesional. Las páginas Dashboard, Canvassing y AI Center se actualizan para usar componentes Tremor en las secciones de métricas y gráficas. La lógica de datos (Supabase queries) no cambia.

**Tech Stack:** `@tremor/react` v3, shadcn/ui existente, Tailwind CSS, Vitest + React Testing Library para tests.

---

## Task 1: Instalar Tremor

**Files:**
- Modify: `apps/web/package.json`

**Step 1: Instalar dependencia**

```bash
cd apps/web
. ~/.nvm/nvm.sh
pnpm add @tremor/react
```

Expected: `Done` sin errores.

**Step 2: Verificar que el build sigue pasando**

```bash
pnpm build
```

Expected: `✓ Compiled successfully`

**Step 3: Commit**

```bash
git add apps/web/package.json apps/web/pnpm-lock.yaml
git commit -m "feat: instalar @tremor/react para componentes de analítica"
```

---

## Task 2: Rediseñar Sidebar

**Files:**
- Modify: `apps/web/components/dashboard/Sidebar.tsx`
- Test: `apps/web/__tests__/components/Sidebar.test.tsx`

**Step 1: Escribir el test que falla**

Crear `apps/web/__tests__/components/Sidebar.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sidebar } from '@/components/dashboard/Sidebar'

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}))

const PROPS = {
  tenantName: 'Campaña Demo',
  campaignName: 'Elecciones 2026',
  userFullName: 'Admin User',
  userRole: 'super_admin',
  userInitials: 'AU',
}

describe('Sidebar', () => {
  it('muestra el nombre de la organización', () => {
    render(<Sidebar {...PROPS} />)
    expect(screen.getByText('Campaña Demo')).toBeInTheDocument()
  })

  it('muestra la campaña activa', () => {
    render(<Sidebar {...PROPS} />)
    expect(screen.getByText('Elecciones 2026')).toBeInTheDocument()
  })

  it('muestra los 6 ítems de navegación', () => {
    render(<Sidebar {...PROPS} />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Campañas')).toBeInTheDocument()
    expect(screen.getByText('Contactos')).toBeInTheDocument()
    expect(screen.getByText('Canvassing')).toBeInTheDocument()
    expect(screen.getByText('Equipo')).toBeInTheDocument()
    expect(screen.getByText('Centro IA')).toBeInTheDocument()
  })

  it('muestra el nombre del usuario en el footer', () => {
    render(<Sidebar {...PROPS} />)
    expect(screen.getByText('Admin User')).toBeInTheDocument()
  })

  it('muestra el badge del rol', () => {
    render(<Sidebar {...PROPS} />)
    expect(screen.getByText('Super Admin')).toBeInTheDocument()
  })

  it('muestra las iniciales del usuario', () => {
    render(<Sidebar {...PROPS} />)
    expect(screen.getByText('AU')).toBeInTheDocument()
  })
})
```

**Step 2: Correr el test — debe fallar**

```bash
cd apps/web && pnpm test -- __tests__/components/Sidebar.test.tsx
```

Expected: FAIL — props no existen en el Sidebar actual.

**Step 3: Implementar el nuevo Sidebar**

Reemplazar `apps/web/components/dashboard/Sidebar.tsx` con:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Megaphone, Users, MapPin, Brain, UserCircle, LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_GROUPS = [
  {
    label: 'Gestión',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/campaigns', label: 'Campañas', icon: Megaphone },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { href: '/dashboard/contacts', label: 'Contactos', icon: Users },
      { href: '/dashboard/canvassing', label: 'Canvassing', icon: MapPin },
    ],
  },
  {
    label: 'Inteligencia',
    items: [
      { href: '/dashboard/team', label: 'Equipo', icon: UserCircle },
      { href: '/dashboard/ai', label: 'Centro IA', icon: Brain },
    ],
  },
]

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  campaign_manager: 'Campaign Manager',
  field_coordinator: 'Coordinador',
  volunteer: 'Voluntario',
  analyst: 'Analista',
}

interface Props {
  tenantName: string
  campaignName: string
  userFullName: string | null
  userRole: string
  userInitials: string
}

export function Sidebar({ tenantName, campaignName, userFullName, userRole, userInitials }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-64 h-screen bg-slate-900 flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="p-5 border-b border-slate-700/50">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{tenantName}</p>
            <p className="text-slate-400 text-xs">CivicOS</p>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg px-3 py-2">
          <p className="text-xs text-slate-400">Campaña activa</p>
          <p className="text-slate-200 text-sm font-medium truncate">{campaignName}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
        {NAV_GROUPS.map(group => {
          const isActive = (href: string) =>
            href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

          return (
            <div key={group.label}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1.5">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800 transition-colors">
          <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">{userInitials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-200 text-sm font-medium truncate">{userFullName ?? 'Usuario'}</p>
            <p className="text-slate-500 text-xs">{ROLE_LABELS[userRole] ?? userRole}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
```

**Step 4: Actualizar dashboard/layout.tsx para pasar las nuevas props**

En `apps/web/app/dashboard/layout.tsx`, calcular `userInitials` y `campaignName` y pasarlos al Sidebar:

```tsx
// Calcular initials
const initials = profile.full_name
  ?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '??'

// En el render — buscar el nombre de la primera campaña
const { data: campaign } = await supabase
  .from('campaigns')
  .select('name')
  .eq('id', profile.campaign_ids?.[0] ?? '')
  .single()

<Sidebar
  tenantName={tenant.name}
  campaignName={campaign?.name ?? 'Sin campaña'}
  userFullName={profile.full_name}
  userRole={profile.role}
  userInitials={initials}
/>
```

**Step 5: Correr tests**

```bash
cd apps/web && pnpm test -- __tests__/components/Sidebar.test.tsx
```

Expected: 6/6 PASS

**Step 6: Correr todos los tests**

```bash
cd apps/web && pnpm test
```

Expected: 38/38 PASS (32 existentes + 6 nuevos)

**Step 7: Verificar build**

```bash
pnpm build
```

Expected: `✓ Compiled successfully`

**Step 8: Commit**

```bash
git add apps/web/components/dashboard/Sidebar.tsx \
        apps/web/app/dashboard/layout.tsx \
        apps/web/__tests__/components/Sidebar.test.tsx
git commit -m "feat: rediseñar sidebar con estilo oscuro profesional"
```

---

## Task 3: Dashboard KPIs con Tremor Metric + AreaChart

**Files:**
- Create: `apps/web/components/dashboard/DashboardKPIs.tsx`
- Modify: `apps/web/app/dashboard/page.tsx`
- Test: `apps/web/__tests__/components/DashboardKPIs.test.tsx`

**Step 1: Escribir el test que falla**

Crear `apps/web/__tests__/components/DashboardKPIs.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardKPIs } from '@/components/dashboard/DashboardKPIs'

vi.mock('@tremor/react', () => ({
  Metric: ({ children }: { children: React.ReactNode }) => <div data-testid="metric">{children}</div>,
  Text: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: () => <div data-testid="area-chart" />,
  BadgeDelta: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

const PROPS = {
  totalContacts: 1250,
  supporters: 480,
  supportRate: 38,
  totalVisits: 320,
  coverageRate: 26,
  pendingVisits: 12,
  weeklyData: [
    { week: '2026-W01', contacts: 100 },
    { week: '2026-W02', contacts: 250 },
  ],
}

describe('DashboardKPIs', () => {
  it('muestra el total de contactos', () => {
    render(<DashboardKPIs {...PROPS} />)
    expect(screen.getByText('1.250')).toBeInTheDocument()
  })

  it('muestra el número de simpatizantes', () => {
    render(<DashboardKPIs {...PROPS} />)
    expect(screen.getByText('480')).toBeInTheDocument()
  })

  it('muestra la cobertura como porcentaje', () => {
    render(<DashboardKPIs {...PROPS} />)
    expect(screen.getByText('26%')).toBeInTheDocument()
  })

  it('muestra las visitas pendientes', () => {
    render(<DashboardKPIs {...PROPS} />)
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('renderiza el AreaChart', () => {
    render(<DashboardKPIs {...PROPS} />)
    expect(screen.getByTestId('area-chart')).toBeInTheDocument()
  })

  it('renderiza 4 métricas', () => {
    render(<DashboardKPIs {...PROPS} />)
    expect(screen.getAllByTestId('metric')).toHaveLength(4)
  })
})
```

**Step 2: Correr el test — debe fallar**

```bash
pnpm test -- __tests__/components/DashboardKPIs.test.tsx
```

Expected: FAIL — componente no existe.

**Step 3: Crear DashboardKPIs.tsx**

Crear `apps/web/components/dashboard/DashboardKPIs.tsx`:

```tsx
'use client'

import { Card, Metric, Text, AreaChart, BadgeDelta } from '@tremor/react'

interface WeeklyDataPoint {
  week: string
  contacts: number
}

interface Props {
  totalContacts: number
  supporters: number
  supportRate: number
  totalVisits: number
  coverageRate: number
  pendingVisits: number
  weeklyData: WeeklyDataPoint[]
}

export function DashboardKPIs({
  totalContacts, supporters, supportRate,
  totalVisits, coverageRate, pendingVisits, weeklyData,
}: Props) {
  const kpis = [
    {
      title: 'Total Contactos',
      value: totalContacts.toLocaleString('es-ES'),
      delta: null,
    },
    {
      title: 'Simpatizantes',
      value: supporters.toLocaleString('es-ES'),
      delta: `${supportRate}% del total`,
    },
    {
      title: 'Cobertura Canvassing',
      value: `${coverageRate}%`,
      delta: `${totalVisits} visitas`,
    },
    {
      title: 'Visitas Pendientes',
      value: pendingVisits.toLocaleString('es-ES'),
      delta: 'Sin aprobar',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <Card key={kpi.title} className="!p-4">
            <Text>{kpi.title}</Text>
            <Metric>{kpi.value}</Metric>
            {kpi.delta && (
              <Text className="text-xs text-slate-400 mt-1">{kpi.delta}</Text>
            )}
          </Card>
        ))}
      </div>

      {weeklyData.length > 0 && (
        <Card>
          <Text className="font-medium mb-4">Contactos registrados por semana</Text>
          <AreaChart
            data={weeklyData}
            index="week"
            categories={['contacts']}
            colors={['blue']}
            valueFormatter={(v) => v.toLocaleString('es-ES')}
            showLegend={false}
            className="h-40"
          />
        </Card>
      )}
    </div>
  )
}
```

**Step 4: Actualizar dashboard/page.tsx para usar DashboardKPIs**

Agregar query de datos semanales y reemplazar la sección de KPI cards por `<DashboardKPIs>`.

Query adicional en `page.tsx`:
```tsx
// Agrupar contactos por semana (últimas 8 semanas)
const { data: weeklyContacts } = await supabase
  .from('contacts')
  .select('created_at')
  .eq('campaign_id', campaignId ?? '')
  .gte('created_at', new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString())

// Agrupar en el servidor
const weeklyMap: Record<string, number> = {}
weeklyContacts?.forEach(c => {
  const d = new Date(c.created_at)
  const week = `S${Math.ceil(d.getDate() / 7)} ${d.toLocaleString('es-ES', { month: 'short' })}`
  weeklyMap[week] = (weeklyMap[week] ?? 0) + 1
})
const weeklyData = Object.entries(weeklyMap).map(([week, contacts]) => ({ week, contacts }))
```

Render:
```tsx
import { DashboardKPIs } from '@/components/dashboard/DashboardKPIs'

// Reemplazar el bloque {/* KPI Grid */} por:
<DashboardKPIs
  totalContacts={totalContacts ?? 0}
  supporters={supporters ?? 0}
  supportRate={supportRate}
  totalVisits={totalVisits ?? 0}
  coverageRate={coverageRate}
  pendingVisits={pendingVisits ?? 0}
  weeklyData={weeklyData}
/>
```

**Step 5: Correr tests**

```bash
pnpm test
```

Expected: 44 PASS

**Step 6: Build**

```bash
pnpm build
```

Expected: sin errores.

**Step 7: Commit**

```bash
git add apps/web/components/dashboard/DashboardKPIs.tsx \
        apps/web/app/dashboard/page.tsx \
        apps/web/__tests__/components/DashboardKPIs.test.tsx
git commit -m "feat: dashboard KPIs y AreaChart con Tremor"
```

---

## Task 4: Canvassing — ProgressBar + BarList

**Files:**
- Create: `apps/web/components/dashboard/CanvassingStats.tsx`
- Modify: `apps/web/app/dashboard/canvassing/page.tsx`
- Test: `apps/web/__tests__/components/CanvassingStats.test.tsx`

**Step 1: Escribir test que falla**

Crear `apps/web/__tests__/components/CanvassingStats.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CanvassingStats } from '@/components/dashboard/CanvassingStats'

vi.mock('@tremor/react', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  Metric: ({ children }: any) => <div data-testid="metric">{children}</div>,
  Text: ({ children }: any) => <div>{children}</div>,
  ProgressBar: ({ value }: any) => <div data-testid="progress-bar" data-value={value} />,
  BarList: ({ data }: any) => <div data-testid="bar-list">{data.map((d: any) => <span key={d.name}>{d.name}</span>)}</div>,
}))

const PROPS = {
  totalZones: 5,
  totalVisits: 200,
  pendingApproval: 15,
  positives: 80,
  resultDistribution: [
    { name: 'Positivo', value: 80 },
    { name: 'Negativo', value: 40 },
    { name: 'Indeciso', value: 50 },
    { name: 'No en casa', value: 20 },
    { name: 'Seguimiento', value: 10 },
  ],
}

describe('CanvassingStats', () => {
  it('muestra el total de zonas', () => {
    render(<CanvassingStats {...PROPS} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('muestra las visitas totales', () => {
    render(<CanvassingStats {...PROPS} />)
    expect(screen.getByText('200')).toBeInTheDocument()
  })

  it('muestra las pendientes de aprobación', () => {
    render(<CanvassingStats {...PROPS} />)
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('renderiza el ProgressBar', () => {
    render(<CanvassingStats {...PROPS} />)
    expect(screen.getByTestId('progress-bar')).toBeInTheDocument()
  })

  it('renderiza el BarList con los resultados', () => {
    render(<CanvassingStats {...PROPS} />)
    expect(screen.getByTestId('bar-list')).toBeInTheDocument()
    expect(screen.getByText('Positivo')).toBeInTheDocument()
    expect(screen.getByText('Negativo')).toBeInTheDocument()
  })
})
```

**Step 2: Correr test — debe fallar**

```bash
pnpm test -- __tests__/components/CanvassingStats.test.tsx
```

Expected: FAIL

**Step 3: Crear CanvassingStats.tsx**

```tsx
'use client'

import { Card, Metric, Text, ProgressBar, BarList } from '@tremor/react'

interface ResultItem {
  name: string
  value: number
}

interface Props {
  totalZones: number
  totalVisits: number
  pendingApproval: number
  positives: number
  resultDistribution: ResultItem[]
}

export function CanvassingStats({
  totalZones, totalVisits, pendingApproval, positives, resultDistribution,
}: Props) {
  const approvalRate = totalVisits > 0
    ? Math.round(((totalVisits - pendingApproval) / totalVisits) * 100)
    : 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="!p-4">
          <Text>Zonas activas</Text>
          <Metric>{totalZones}</Metric>
        </Card>
        <Card className="!p-4">
          <Text>Total visitas</Text>
          <Metric>{totalVisits}</Metric>
        </Card>
        <Card className="!p-4">
          <Text className="text-orange-500">Pendientes aprobación</Text>
          <Metric>{pendingApproval}</Metric>
        </Card>
        <Card className="!p-4">
          <Text className="text-green-600">Positivos</Text>
          <Metric>{positives}</Metric>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="!p-4">
          <Text className="font-medium mb-2">Tasa de aprobación</Text>
          <div className="flex items-center justify-between mb-1">
            <Text className="text-sm">{approvalRate}% aprobadas</Text>
            <Text className="text-sm text-slate-400">{totalVisits - pendingApproval}/{totalVisits}</Text>
          </div>
          <ProgressBar value={approvalRate} color="blue" />
        </Card>

        {resultDistribution.length > 0 && (
          <Card className="!p-4">
            <Text className="font-medium mb-3">Distribución de resultados</Text>
            <BarList data={resultDistribution} color="blue" />
          </Card>
        )}
      </div>
    </div>
  )
}
```

**Step 4: Actualizar canvassing/page.tsx**

Reemplazar el bloque `{/* Stats */}` con:

```tsx
import { CanvassingStats } from '@/components/dashboard/CanvassingStats'

const resultDistribution = [
  { name: 'Positivo', value: recentVisits?.filter(v => v.result === 'positive').length ?? 0 },
  { name: 'Negativo', value: recentVisits?.filter(v => v.result === 'negative').length ?? 0 },
  { name: 'Indeciso', value: recentVisits?.filter(v => v.result === 'undecided').length ?? 0 },
  { name: 'No en casa', value: recentVisits?.filter(v => v.result === 'no_home').length ?? 0 },
  { name: 'Seguimiento', value: recentVisits?.filter(v => v.result === 'follow_up').length ?? 0 },
].filter(r => r.value > 0)

<CanvassingStats
  totalZones={zones?.length ?? 0}
  totalVisits={totalVisits ?? 0}
  pendingApproval={pendingApproval ?? 0}
  positives={recentVisits?.filter(v => v.result === 'positive').length ?? 0}
  resultDistribution={resultDistribution}
/>
```

**Step 5: Correr tests + build**

```bash
pnpm test && pnpm build
```

Expected: todos los tests PASS, build sin errores.

**Step 6: Commit**

```bash
git add apps/web/components/dashboard/CanvassingStats.tsx \
        apps/web/app/dashboard/canvassing/page.tsx \
        apps/web/__tests__/components/CanvassingStats.test.tsx
git commit -m "feat: canvassing stats con Tremor ProgressBar y BarList"
```

---

## Task 5: Centro IA — DonutChart + badges semánticos

**Files:**
- Modify: `apps/web/components/dashboard/AISuggestionsPanel.tsx`
- Create: `apps/web/components/dashboard/AIStatusChart.tsx`
- Test: `apps/web/__tests__/components/AIStatusChart.test.tsx`

**Step 1: Escribir test que falla**

Crear `apps/web/__tests__/components/AIStatusChart.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AIStatusChart } from '@/components/dashboard/AIStatusChart'

vi.mock('@tremor/react', () => ({
  DonutChart: ({ data }: any) => (
    <div data-testid="donut-chart">
      {data.map((d: any) => <span key={d.name}>{d.name}</span>)}
    </div>
  ),
  Legend: ({ categories }: any) => <div>{categories.join(',')}</div>,
  Card: ({ children }: any) => <div>{children}</div>,
  Text: ({ children }: any) => <div>{children}</div>,
}))

const PROPS = {
  active: 5,
  applied: 12,
  dismissed: 3,
}

describe('AIStatusChart', () => {
  it('renderiza el DonutChart', () => {
    render(<AIStatusChart {...PROPS} />)
    expect(screen.getByTestId('donut-chart')).toBeInTheDocument()
  })

  it('muestra las 3 categorías de estado', () => {
    render(<AIStatusChart {...PROPS} />)
    expect(screen.getByText('Activas')).toBeInTheDocument()
    expect(screen.getByText('Aplicadas')).toBeInTheDocument()
    expect(screen.getByText('Descartadas')).toBeInTheDocument()
  })

  it('no renderiza si no hay datos', () => {
    render(<AIStatusChart active={0} applied={0} dismissed={0} />)
    expect(screen.queryByTestId('donut-chart')).not.toBeInTheDocument()
  })
})
```

**Step 2: Correr test — debe fallar**

```bash
pnpm test -- __tests__/components/AIStatusChart.test.tsx
```

Expected: FAIL

**Step 3: Crear AIStatusChart.tsx**

```tsx
'use client'

import { DonutChart, Legend, Card, Text } from '@tremor/react'

interface Props {
  active: number
  applied: number
  dismissed: number
}

export function AIStatusChart({ active, applied, dismissed }: Props) {
  const total = active + applied + dismissed
  if (total === 0) return null

  const data = [
    { name: 'Activas', value: active },
    { name: 'Aplicadas', value: applied },
    { name: 'Descartadas', value: dismissed },
  ]

  return (
    <Card className="!p-4">
      <Text className="font-medium mb-3">Estado de sugerencias IA</Text>
      <DonutChart
        data={data}
        category="value"
        index="name"
        colors={['blue', 'green', 'slate']}
        className="h-32"
        valueFormatter={(v) => `${v} sugerencias`}
      />
      <Legend
        categories={['Activas', 'Aplicadas', 'Descartadas']}
        colors={['blue', 'green', 'slate']}
        className="mt-3"
      />
    </Card>
  )
}
```

**Step 4: Integrar en AI page**

En `apps/web/app/dashboard/ai/page.tsx`, agregar query de totales y renderizar `<AIStatusChart>`:

```tsx
import { AIStatusChart } from '@/components/dashboard/AIStatusChart'

// Query adicional
const { count: appliedCount } = await supabase
  .from('ai_suggestions')
  .select('*', { count: 'exact', head: true })
  .eq('campaign_id', campaignId ?? '')
  .eq('status', 'applied')

const { count: dismissedCount } = await supabase
  .from('ai_suggestions')
  .select('*', { count: 'exact', head: true })
  .eq('campaign_id', campaignId ?? '')
  .in('status', ['dismissed', 'rejected'])

// En el render, antes del panel de sugerencias:
<AIStatusChart
  active={suggestions?.length ?? 0}
  applied={appliedCount ?? 0}
  dismissed={dismissedCount ?? 0}
/>
```

**Step 5: Correr todos los tests**

```bash
pnpm test
```

Expected: 50+ PASS, 0 FAIL.

**Step 6: Build final**

```bash
pnpm build
```

Expected: `✓ Compiled successfully`, 0 errores TypeScript.

**Step 7: Commit final**

```bash
git add apps/web/components/dashboard/AIStatusChart.tsx \
        apps/web/components/dashboard/AISuggestionsPanel.tsx \
        apps/web/app/dashboard/ai/page.tsx \
        apps/web/__tests__/components/AIStatusChart.test.tsx
git commit -m "feat: Centro IA con Tremor DonutChart y badges semánticos"
```

---

## Verificación final

```bash
# Todos los tests pasan
cd apps/web && pnpm test
# Expected: X passed, 0 failed

# Build limpio
pnpm build
# Expected: ✓ Compiled successfully

# Dev server responde
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard
# Expected: 200 o 307
```
