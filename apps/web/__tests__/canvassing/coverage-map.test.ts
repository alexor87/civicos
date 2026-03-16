import { describe, it, expect } from 'vitest'
import { getCoverageColor } from '@/components/maps/TerritoryMap'

describe('getCoverageColor', () => {
  it('returns red for 0% (no visits)', () => {
    expect(getCoverageColor(0)).toBe('#ef4444')
  })

  it('returns orange for low coverage (1–33%)', () => {
    expect(getCoverageColor(1)).toBe('#f97316')
    expect(getCoverageColor(20)).toBe('#f97316')
    expect(getCoverageColor(33)).toBe('#f97316')
  })

  it('returns yellow for mid coverage (34–66%)', () => {
    expect(getCoverageColor(34)).toBe('#eab308')
    expect(getCoverageColor(50)).toBe('#eab308')
    expect(getCoverageColor(66)).toBe('#eab308')
  })

  it('returns light green for high coverage (67–99%)', () => {
    expect(getCoverageColor(67)).toBe('#84cc16')
    expect(getCoverageColor(80)).toBe('#84cc16')
    expect(getCoverageColor(99)).toBe('#84cc16')
  })

  it('returns dark green for 100% (complete)', () => {
    expect(getCoverageColor(100)).toBe('#22c55e')
  })

  it('clamps values above 100 to dark green', () => {
    expect(getCoverageColor(110)).toBe('#22c55e')
  })
})
