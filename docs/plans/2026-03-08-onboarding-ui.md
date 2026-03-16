# Onboarding Split-Screen UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign login and register pages with professional split-screen layout matching the dashboard design system (slate-900 left panel + white right panel with form).

**Architecture:** Extract shared `AuthLayout` component (left panel), then update `LoginPage` to use it, then convert `RegisterPage` to a 2-step form. All pages use shadcn/ui components exclusively (no Tremor — Tremor is for analytics only). Auth logic (Supabase calls, API routes) is not touched.

**Tech Stack:** Next.js App Router, shadcn/ui (Button, Input, Label, Card), Lucide React icons (Shield, Users, MapPin, BarChart3, ChevronRight, ChevronLeft), Vitest + React Testing Library

---

## Test command

```bash
cd "/Users/user/Documents/Dev/Prueba 1/civicos/apps/web" && pnpm vitest run
```

Expected baseline before starting: all existing tests pass.

---

### Task 1: AuthLayout component (shared left panel)

**Files:**
- Create: `apps/web/components/auth/AuthLayout.tsx`
- Create: `apps/web/__tests__/components/AuthLayout.test.tsx`

---

**Step 1: Write the failing test**

Create `apps/web/__tests__/components/AuthLayout.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthLayout } from '@/components/auth/AuthLayout'

describe('AuthLayout', () => {
  it('renders the CivicOS logo text', () => {
    render(<AuthLayout tagline="Test tagline"><div /></AuthLayout>)
    expect(screen.getByText('CivicOS')).toBeInTheDocument()
  })

  it('renders the tagline prop', () => {
    render(<AuthLayout tagline="14 días gratis"><div /></AuthLayout>)
    expect(screen.getByText('14 días gratis')).toBeInTheDocument()
  })

  it('renders all three feature bullets', () => {
    render(<AuthLayout tagline="x"><div /></AuthLayout>)
    expect(screen.getByText(/CRM de contactos/i)).toBeInTheDocument()
    expect(screen.getByText(/Canvassing coordinado/i)).toBeInTheDocument()
    expect(screen.getByText(/Analítica electoral/i)).toBeInTheDocument()
  })

  it('renders the social proof footer', () => {
    render(<AuthLayout tagline="x"><div /></AuthLayout>)
    expect(screen.getByText(/50 organizaciones/i)).toBeInTheDocument()
  })

  it('renders children in the right panel', () => {
    render(<AuthLayout tagline="x"><div data-testid="child-content">form</div></AuthLayout>)
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd "/Users/user/Documents/Dev/Prueba 1/civicos/apps/web" && pnpm vitest run __tests__/components/AuthLayout.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/auth/AuthLayout'`

**Step 3: Create the component**

Create `apps/web/components/auth/AuthLayout.tsx`:

```tsx
import { Shield, Users, MapPin, BarChart3 } from 'lucide-react'

interface Props {
  tagline: string
  children: React.ReactNode
}

const features = [
  { icon: Users, text: 'CRM de contactos con IA integrada' },
  { icon: MapPin, text: 'Canvassing coordinado en tiempo real' },
  { icon: BarChart3, text: 'Analítica electoral por zona y segmento' },
]

export function AuthLayout({ tagline, children }: Props) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between bg-slate-900 p-10">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-white text-xl font-bold">CivicOS</span>
          </div>

          {/* Tagline */}
          <h2 className="text-white text-2xl font-semibold leading-snug mb-8">
            {tagline}
          </h2>

          {/* Feature bullets */}
          <ul className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-blue-600/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-slate-300 text-sm leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Social proof footer */}
        <p className="text-slate-500 text-xs">
          Usado por más de 50 organizaciones en LATAM
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
cd "/Users/user/Documents/Dev/Prueba 1/civicos/apps/web" && pnpm vitest run __tests__/components/AuthLayout.test.tsx
```

Expected: PASS — 5/5 tests pass

**Step 5: Commit**

```bash
cd "/Users/user/Documents/Dev/Prueba 1/civicos/apps/web" && git add components/auth/AuthLayout.tsx __tests__/components/AuthLayout.test.tsx && git commit -m "feat: add AuthLayout split-screen component with tests"
```

---

### Task 2: Redesign LoginPage

**Files:**
- Modify: `apps/web/app/(auth)/login/page.tsx`
- Create: `apps/web/__tests__/components/LoginPage.test.tsx`

---

**Step 1: Write the failing test**

Create `apps/web/__tests__/components/LoginPage.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mocks
const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

const mockSignIn = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signInWithPassword: mockSignIn },
  }),
}))

import LoginPage from '@/app/(auth)/login/page'

beforeEach(() => vi.clearAllMocks())

describe('LoginPage', () => {
  it('renders the welcome heading', () => {
    render(<LoginPage />)
    expect(screen.getByText('Bienvenido de vuelta')).toBeInTheDocument()
  })

  it('renders email and password inputs', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
  })

  it('renders the submit button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('renders a link to register', () => {
    render(<LoginPage />)
    expect(screen.getByRole('link', { name: /regístrate/i })).toBeInTheDocument()
  })

  it('shows error message when login fails', async () => {
    mockSignIn.mockResolvedValueOnce({ error: { message: 'Credenciales inválidas' } })
    render(<LoginPage />)
    await userEvent.type(screen.getByLabelText(/email/i), 'test@test.com')
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument()
  })

  it('redirects to dashboard on successful login', async () => {
    mockSignIn.mockResolvedValueOnce({ error: null })
    render(<LoginPage />)
    await userEvent.type(screen.getByLabelText(/email/i), 'test@test.com')
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'correct')
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    await vi.waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'))
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd "/Users/user/Documents/Dev/Prueba 1/civicos/apps/web" && pnpm vitest run __tests__/components/LoginPage.test.tsx
```

Expected: FAIL — "Bienvenido de vuelta" not found (current page shows "Iniciar sesión")

**Step 3: Rewrite LoginPage**

Replace the entire content of `apps/web/app/(auth)/login/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/components/auth/AuthLayout'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <AuthLayout tagline="Inteligencia electoral para equipos que ganan">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bienvenido de vuelta</h1>
          <p className="text-slate-500 mt-1 text-sm">Ingresa a tu organización</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="juan@campana.org"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          ¿Nueva organización?{' '}
          <Link href="/register" className="text-blue-600 hover:underline font-medium">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
cd "/Users/user/Documents/Dev/Prueba 1/civicos/apps/web" && pnpm vitest run __tests__/components/LoginPage.test.tsx
```

Expected: PASS — 6/6 tests pass

**Step 5: Run all tests to verify no regressions**

```bash
cd "/Users/user/Documents/Dev/Prueba 1/civicos/apps/web" && pnpm vitest run
```

Expected: All tests pass

**Step 6: Commit**

```bash
cd "/Users/user/Documents/Dev/Prueba 1/civicos/apps/web" && git add app/\(auth\)/login/page.tsx __tests__/components/LoginPage.test.tsx && git commit -m "feat: redesign login page with split-screen AuthLayout"
```

---

### Task 3: Redesign RegisterPage (2-step form)

**Files:**
- Modify: `apps/web/app/(auth)/register/page.tsx`
- Create: `apps/web/__tests__/components/RegisterPage.test.tsx`

---

**Step 1: Write the failing test**

Create `apps/web/__tests__/components/RegisterPage.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

const mockSignIn = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signInWithPassword: mockSignIn },
  }),
}))

global.fetch = vi.fn()

import RegisterPage from '@/app/(auth)/register/page'

beforeEach(() => vi.clearAllMocks())

describe('RegisterPage', () => {
  it('shows step 1 by default', () => {
    render(<RegisterPage />)
    expect(screen.getByText('Tu organización')).toBeInTheDocument()
  })

  it('shows progress indicator "Paso 1 de 2" on step 1', () => {
    render(<RegisterPage />)
    expect(screen.getByText('Paso 1 de 2')).toBeInTheDocument()
  })

  it('shows org name and email fields on step 1', () => {
    render(<RegisterPage />)
    expect(screen.getByLabelText(/nombre de la organización/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('advances to step 2 when clicking Siguiente', async () => {
    render(<RegisterPage />)
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(screen.getByText('Tu primera campaña')).toBeInTheDocument()
  })

  it('shows progress indicator "Paso 2 de 2" on step 2', async () => {
    render(<RegisterPage />)
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(screen.getByText('Paso 2 de 2')).toBeInTheDocument()
  })

  it('shows a Volver button on step 2', async () => {
    render(<RegisterPage />)
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument()
  })

  it('goes back to step 1 when clicking Volver', async () => {
    render(<RegisterPage />)
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    await userEvent.click(screen.getByRole('button', { name: /volver/i }))
    expect(screen.getByText('Tu organización')).toBeInTheDocument()
  })

  it('shows campaign name field on step 2', async () => {
    render(<RegisterPage />)
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(screen.getByLabelText(/nombre de la campaña/i)).toBeInTheDocument()
  })

  it('auto-generates slug from org name', async () => {
    render(<RegisterPage />)
    await userEvent.type(screen.getByLabelText(/nombre de la organización/i), 'Mi Partido')
    const slugInput = screen.getByPlaceholderText('mi-org')
    expect((slugInput as HTMLInputElement).value).toBe('mi-partido')
  })

  it('shows error message when registration fails', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'El subdominio ya existe' }),
    })
    render(<RegisterPage />)
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    await userEvent.click(screen.getByRole('button', { name: /crear organización/i }))
    expect(await screen.findByText('El subdominio ya existe')).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd "/Users/user/Documents/Dev/Prueba 1/civicos/apps/web" && pnpm vitest run __tests__/components/RegisterPage.test.tsx
```

Expected: FAIL — "Tu organización" not found, "Paso 1 de 2" not found

**Step 3: Rewrite RegisterPage**

Replace the entire content of `apps/web/app/(auth)/register/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState({
    orgName: '',
    slug: '',
    fullName: '',
    email: '',
    password: '',
    campaignName: '',
    electionDate: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm(prev => {
      const next = { ...prev, [name]: value }
      if (name === 'orgName') {
        next.slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear la organización')

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (signInError) throw signInError

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setLoading(false)
    }
  }

  return (
    <AuthLayout tagline="14 días gratis, sin tarjeta de crédito">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold text-slate-900">
              {step === 1 ? 'Tu organización' : 'Tu primera campaña'}
            </h1>
            <span className="text-xs text-slate-400 font-medium">Paso {step} de 2</span>
          </div>
          <p className="text-slate-500 text-sm">
            {step === 1
              ? 'Crea tu cuenta de administrador'
              : 'Configura tu primera campaña electoral'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-slate-100 rounded-full">
          <div
            className="h-1 bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        {step === 1 ? (
          <form
            onSubmit={e => { e.preventDefault(); setStep(2) }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="orgName">Nombre de la organización</Label>
              <Input
                id="orgName"
                name="orgName"
                placeholder="Partido / ONG / Consultoría"
                value={form.orgName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Subdominio</Label>
              <div className="flex items-center gap-1">
                <Input
                  id="slug"
                  name="slug"
                  placeholder="mi-org"
                  value={form.slug}
                  onChange={handleChange}
                  required
                  className="flex-1"
                />
                <span className="text-slate-400 text-sm whitespace-nowrap">.civicos.app</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Tu nombre completo</Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="Juan García"
                value={form.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="juan@org.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={8}
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Siguiente
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaignName">Nombre de la campaña</Label>
              <Input
                id="campaignName"
                name="campaignName"
                placeholder="Elecciones Municipales 2026"
                value={form.campaignName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="electionDate">Fecha de elección</Label>
              <Input
                id="electionDate"
                name="electionDate"
                type="date"
                value={form.electionDate}
                onChange={handleChange}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Volver
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Creando organización...' : 'Crear organización'}
              </Button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
cd "/Users/user/Documents/Dev/Prueba 1/civicos/apps/web" && pnpm vitest run __tests__/components/RegisterPage.test.tsx
```

Expected: PASS — 10/10 tests pass

**Step 5: Run all tests to verify no regressions**

```bash
cd "/Users/user/Documents/Dev/Prueba 1/civicos/apps/web" && pnpm vitest run
```

Expected: All existing tests + new tests pass (no failures)

**Step 6: Commit**

```bash
cd "/Users/user/Documents/Dev/Prueba 1/civicos/apps/web" && git add app/\(auth\)/register/page.tsx __tests__/components/RegisterPage.test.tsx && git commit -m "feat: redesign register page with 2-step split-screen form"
```

---

## Definition of Done

- [ ] `AuthLayout` component renders left panel (logo, tagline, bullets, social proof) and wraps children in right panel
- [ ] `LoginPage` uses `AuthLayout`, shows "Bienvenido de vuelta", handles login/error correctly
- [ ] `RegisterPage` uses `AuthLayout`, has 2-step flow with progress indicator, auto-generates slug
- [ ] All new tests pass (AuthLayout: 5, LoginPage: 6, RegisterPage: 10 = 21 new tests)
- [ ] All pre-existing tests continue to pass
- [ ] No auth logic was changed (Supabase calls, API routes identical)
