import { describe, it, expect } from 'vitest'
import {
  calculatePoints,
  getLevel,
  getProgressToNextLevel,
  LEVELS,
} from '@/lib/gamification'

describe('calculatePoints', () => {
  it('returns 0 for empty visits', () => {
    expect(calculatePoints([])).toBe(0)
  })

  it('gives 10 pts for approved positive visit', () => {
    expect(calculatePoints([{ status: 'approved', result: 'positive' }])).toBe(10)
  })

  it('gives 5 pts for approved undecided visit', () => {
    expect(calculatePoints([{ status: 'approved', result: 'undecided' }])).toBe(5)
  })

  it('gives 4 pts for approved follow_up visit', () => {
    expect(calculatePoints([{ status: 'approved', result: 'follow_up' }])).toBe(4)
  })

  it('gives 3 pts for approved negative visit', () => {
    expect(calculatePoints([{ status: 'approved', result: 'negative' }])).toBe(3)
  })

  it('gives 2 pts for approved no_home visit', () => {
    expect(calculatePoints([{ status: 'approved', result: 'no_home' }])).toBe(2)
  })

  it('gives 1 pt for submitted (pending) visit', () => {
    expect(calculatePoints([{ status: 'submitted', result: 'positive' }])).toBe(1)
  })

  it('gives 0 pts for rejected visit', () => {
    expect(calculatePoints([{ status: 'rejected', result: 'positive' }])).toBe(0)
  })

  it('uses default 2 pts for approved visit with unknown result', () => {
    expect(calculatePoints([{ status: 'approved', result: 'unknown_type' }])).toBe(2)
  })

  it('uses default 2 pts for approved visit with null result', () => {
    expect(calculatePoints([{ status: 'approved', result: null }])).toBe(2)
  })

  it('accumulates points across multiple visits', () => {
    const visits = [
      { status: 'approved', result: 'positive' },   // 10
      { status: 'approved', result: 'undecided' },  // 5
      { status: 'submitted', result: 'negative' },  // 1
      { status: 'rejected',  result: 'positive' },  // 0
    ]
    expect(calculatePoints(visits)).toBe(16)
  })
})

describe('getLevel', () => {
  it('returns Iniciado for 0 pts', () => {
    expect(getLevel(0).name).toBe('Iniciado')
  })

  it('returns Iniciado for 49 pts', () => {
    expect(getLevel(49).name).toBe('Iniciado')
  })

  it('returns Activista for 50 pts', () => {
    expect(getLevel(50).name).toBe('Activista')
  })

  it('returns Embajador for 150 pts', () => {
    expect(getLevel(150).name).toBe('Embajador')
  })

  it('returns Capitán for 300 pts', () => {
    expect(getLevel(300).name).toBe('Capitán')
  })

  it('returns Leyenda for 500 pts', () => {
    expect(getLevel(500).name).toBe('Leyenda')
  })

  it('returns Leyenda for 9999 pts', () => {
    expect(getLevel(9999).name).toBe('Leyenda')
  })
})

describe('getProgressToNextLevel', () => {
  it('returns 0% progress at level min boundary', () => {
    const p = getProgressToNextLevel(0)
    expect(p.pct).toBe(0)
    expect(p.next).toBe(50)
  })

  it('returns 50% progress at midpoint of Iniciado', () => {
    const p = getProgressToNextLevel(25)
    expect(p.pct).toBe(50)
  })

  it('returns 100% and null next for Leyenda', () => {
    const p = getProgressToNextLevel(500)
    expect(p.pct).toBe(100)
    expect(p.next).toBeNull()
  })

  it('returns correct next threshold for Activista', () => {
    const p = getProgressToNextLevel(50)
    expect(p.next).toBe(150)
  })
})

describe('LEVELS', () => {
  it('has 5 levels', () => {
    expect(LEVELS).toHaveLength(5)
  })

  it('levels are in ascending order', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].min).toBeGreaterThan(LEVELS[i - 1].min)
    }
  })
})
