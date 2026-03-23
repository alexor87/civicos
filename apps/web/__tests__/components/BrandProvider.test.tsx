import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { BrandProvider, brandFromColor, type TenantBrand } from '@/components/dashboard/BrandProvider'

const DEFAULT_BRAND: TenantBrand = {
  color_primary:    '#dc2626',
  color_secondary:  '#1e293b',
  color_accent:     '#ea580c',
  color_background: '#f8fafc',
  color_surface:    '#ffffff',
}

const CSS_PROPS = [
  '--color-primary',
  '--color-secondary',
  '--color-accent',
  '--color-background',
  '--color-surface',
  '--primary',
]

describe('BrandProvider', () => {
  beforeEach(() => {
    CSS_PROPS.forEach(p => document.documentElement.style.removeProperty(p))
  })

  afterEach(() => {
    cleanup()
    CSS_PROPS.forEach(p => document.documentElement.style.removeProperty(p))
  })

  it('sets all 5 CSS tokens on mount', () => {
    render(
      <BrandProvider brand={DEFAULT_BRAND}>
        <div />
      </BrandProvider>
    )
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#dc2626')
    expect(document.documentElement.style.getPropertyValue('--color-secondary')).toBe('#1e293b')
    expect(document.documentElement.style.getPropertyValue('--color-accent')).toBe('#ea580c')
    expect(document.documentElement.style.getPropertyValue('--color-background')).toBe('#f8fafc')
    expect(document.documentElement.style.getPropertyValue('--color-surface')).toBe('#ffffff')
  })

  it('also sets --primary for backward compat', () => {
    render(
      <BrandProvider brand={DEFAULT_BRAND}>
        <div />
      </BrandProvider>
    )
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('#dc2626')
  })

  it('updates tokens when brand changes', () => {
    const brand1: TenantBrand = { ...DEFAULT_BRAND, color_primary: '#2960ec' }
    const brand2: TenantBrand = { ...DEFAULT_BRAND, color_primary: '#7c3aed', color_accent: '#16a34a' }

    const { rerender } = render(<BrandProvider brand={brand1}><div /></BrandProvider>)
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#2960ec')

    rerender(<BrandProvider brand={brand2}><div /></BrandProvider>)
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#7c3aed')
    expect(document.documentElement.style.getPropertyValue('--color-accent')).toBe('#16a34a')
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('#7c3aed')
  })

  it('removes all CSS tokens on unmount', () => {
    const { unmount } = render(
      <BrandProvider brand={DEFAULT_BRAND}>
        <div />
      </BrandProvider>
    )
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#dc2626')

    unmount()
    CSS_PROPS.forEach(p => {
      expect(document.documentElement.style.getPropertyValue(p)).toBe('')
    })
  })

  it('renders children', () => {
    const { getByText } = render(
      <BrandProvider brand={DEFAULT_BRAND}>
        <span>Hello world</span>
      </BrandProvider>
    )
    expect(getByText('Hello world')).toBeTruthy()
  })

  describe('brandFromColor helper', () => {
    it('builds a TenantBrand from a single hex', () => {
      const brand = brandFromColor('#dc2626')
      expect(brand.color_primary).toBe('#dc2626')
      expect(brand.color_secondary).toBe('#1e293b')
      expect(brand.color_accent).toBe('#ea580c')
      expect(brand.color_background).toBe('#f8fafc')
      expect(brand.color_surface).toBe('#ffffff')
    })
  })
})
