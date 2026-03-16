# CivicOS — Diseño Onboarding Split-Screen

**Fecha:** 2026-03-08
**Estado:** Aprobado por PM
**Alcance:** Login + Register — páginas de autenticación

---

## Objetivo

Elevar las páginas de login y registro al mismo nivel visual que el dashboard, cumpliendo el design system shadcn/ui + identidad de marca `slate-900`.

---

## Layout: Split-Screen (60/40)

Ambas páginas usan el mismo layout de dos paneles:

- **Panel izquierdo (40%):** `slate-900`, fondo oscuro con identidad de marca
- **Panel derecho (60%):** blanco, contiene el formulario

---

## Panel Izquierdo (compartido)

- Logo: ícono escudo azul (`Shield` de Lucide) + "CivicOS" en tipografía bold blanca
- Tagline diferenciada por página:
  - Login: *"Inteligencia electoral para equipos que ganan"*
  - Register: *"14 días gratis, sin tarjeta de crédito"*
- 3 bullets de propuesta de valor con íconos Lucide (Users, MapPin, BarChart3):
  - CRM de contactos con IA integrada
  - Canvassing coordinado en tiempo real
  - Analítica electoral por zona y segmento
- Footer: `"Usado por más de 50 organizaciones en LATAM"`

---

## Login — Panel Derecho

- Header: "Bienvenido de vuelta" + descripción
- Campos: Email + Contraseña (lógica sin cambios)
- Botón primario azul full-width
- Mensaje de error consistente con design system
- Link a registro

---

## Registro — Panel Derecho (2 pasos)

**Paso 1 — Tu organización:**
- Nombre de organización (auto-genera slug)
- Preview de subdominio: `slug.civicos.app`
- Nombre completo del admin
- Email + Contraseña

**Paso 2 — Tu primera campaña:**
- Nombre de la campaña
- Fecha de elección
- Progress indicator visual (Paso 1/2 → Paso 2/2)

La lógica de API (`/api/onboarding`) y validaciones no cambian.

---

## Lo que NO cambia

- Lógica Supabase auth
- API route `/api/onboarding`
- Validaciones de formulario
- Tests existentes

---

## Decisiones técnicas

- Componente `AuthLayout` reutilizable para ambas páginas (panel izquierdo)
- shadcn/ui para todos los form elements (Input, Label, Button, Card)
- Sin Tremor (Tremor es para analítica, no formularios)
- Responsive: en mobile el panel izquierdo se colapsa a header compacto
- Todos los nuevos componentes llevan tests en `__tests__/components/`
