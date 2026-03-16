export type VisitForPoints = {
  status: string
  result: string | null
}

export type Level = {
  name:  string
  badge: string
  color: string
  min:   number
  max:   number
}

export const LEVELS: Level[] = [
  { name: 'Iniciado',   badge: '🌱', color: '#6a737d', min: 0,   max: 49  },
  { name: 'Activista',  badge: '⚡', color: '#2262ec', min: 50,  max: 149 },
  { name: 'Embajador',  badge: '🌟', color: '#28a745', min: 150, max: 299 },
  { name: 'Capitán',    badge: '🏆', color: '#f8cf0c', min: 300, max: 499 },
  { name: 'Leyenda',    badge: '🔥', color: '#dc3545', min: 500, max: Infinity },
]

const POINT_VALUES: Record<string, number> = {
  positive:   10,
  undecided:   5,
  follow_up:   4,
  negative:    3,
  no_home:     2,
  refused:     2,
  contacted:   3,
  not_home:    2,
}

const DEFAULT_APPROVED_POINTS = 2

export function calculatePoints(visits: VisitForPoints[]): number {
  let total = 0
  for (const v of visits) {
    if (v.status === 'approved') {
      total += POINT_VALUES[v.result ?? ''] ?? DEFAULT_APPROVED_POINTS
    } else if (v.status === 'submitted') {
      total += 1
    }
    // rejected = 0
  }
  return total
}

export function getLevel(points: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].min) return LEVELS[i]
  }
  return LEVELS[0]
}

export type ProgressToNextLevel = {
  current: number
  next:    number | null
  pct:     number
}

export function getProgressToNextLevel(points: number): ProgressToNextLevel {
  const level = getLevel(points)
  const idx = LEVELS.indexOf(level)
  const next = LEVELS[idx + 1] ?? null
  if (!next) return { current: points, next: null, pct: 100 }
  const pct = Math.round(((points - level.min) / (next.min - level.min)) * 100)
  return { current: points, next: next.min, pct }
}

export type LeaderboardEntry = {
  id:       string
  name:     string
  points:   number
  level:    Level
  visitas:  number
  rank:     number
}
