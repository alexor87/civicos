'use client'

import { useEffect } from 'react'
import type { TenantBrand } from '@/lib/brand-utils'

// Re-export so existing imports from BrandProvider still work
export type { TenantBrand } from '@/lib/brand-utils'
export { brandFromColor } from '@/lib/brand-utils'

interface Props {
  brand: TenantBrand
  children: React.ReactNode
}

/** Injects the 5 brand CSS tokens into :root at runtime so all Tailwind
 *  utilities that reference var(--color-*) and var(--primary) reflect
 *  the tenant's palette immediately on the client side. */
export function BrandProvider({ brand, children }: Props) {
  useEffect(() => {
    const el = document.documentElement
    el.style.setProperty('--color-primary',    brand.color_primary)
    el.style.setProperty('--color-secondary',  brand.color_secondary)
    el.style.setProperty('--color-accent',     brand.color_accent)
    el.style.setProperty('--color-background', brand.color_background)
    el.style.setProperty('--color-surface',    brand.color_surface)
    // Backward compat: --primary drives existing bg-primary / text-primary utilities
    el.style.setProperty('--primary', brand.color_primary)

    return () => {
      el.style.removeProperty('--color-primary')
      el.style.removeProperty('--color-secondary')
      el.style.removeProperty('--color-accent')
      el.style.removeProperty('--color-background')
      el.style.removeProperty('--color-surface')
      el.style.removeProperty('--primary')
    }
  }, [
    brand.color_primary,
    brand.color_secondary,
    brand.color_accent,
    brand.color_background,
    brand.color_surface,
  ])

  return <>{children}</>
}
