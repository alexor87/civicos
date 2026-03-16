'use client'

import Link from 'next/link'
import type { LeaderboardEntry } from '@/lib/gamification'

const RANK_COLORS: Record<number, string> = {
  1: 'text-yellow-500 font-bold',
  2: 'text-slate-400 font-bold',
  3: 'text-amber-600 font-bold',
}

const RANK_BG: Record<number, string> = {
  1: 'bg-yellow-50 border-yellow-200',
  2: 'bg-slate-50 border-slate-200',
  3: 'bg-amber-50 border-amber-200',
}

interface Props {
  entries: LeaderboardEntry[]
}

export function VolunteerLeaderboard({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-[#6a737d]">
        No hay datos de visitas todavía. El ranking aparecerá cuando los voluntarios registren visitas.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {entries.map(entry => (
        <Link
          key={entry.id}
          href={`/dashboard/team/${entry.id}`}
          className={`flex items-center gap-4 px-4 py-3 rounded-lg border transition-colors hover:opacity-90 ${RANK_BG[entry.rank] ?? 'bg-white border-[#dcdee6]'}`}
        >
          {/* Rank */}
          <span className={`w-8 text-center text-base ${RANK_COLORS[entry.rank] ?? 'text-[#6a737d]'}`}>
            {entry.rank <= 3 ? ['🥇','🥈','🥉'][entry.rank - 1] : `#${entry.rank}`}
          </span>

          {/* Avatar */}
          <div className="h-9 w-9 rounded-full bg-[#2262ec] text-white flex items-center justify-center text-sm font-semibold shrink-0">
            {entry.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>

          {/* Name + level */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[#1b1f23] text-sm truncate">{entry.name}</p>
            <p className="text-xs text-[#6a737d]">
              {entry.level.badge} {entry.level.name}
            </p>
          </div>

          {/* Stats */}
          <div className="text-right shrink-0">
            <p className="font-semibold text-[#1b1f23] text-sm">{entry.points.toLocaleString()} pts</p>
            <p className="text-xs text-[#6a737d]">{entry.visitas} visitas</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
