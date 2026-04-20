'use client'

import { useState } from 'react'
import { Search, Trophy, Users, Star, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ShareButton } from '@/components/ShareButton'
import { normalizePhone } from '@/lib/utils'
import { getSupabase } from '@/lib/supabase-anon'

interface ReferralConfig {
  campaign_id: string
  slug: string
  primary_color: string
  level_names: string[]
  level_thresholds: number[]
  whatsapp_share_message?: string | null
}

interface ReferrerStats {
  referrer_name: string | null
  total_referrals: number
  referrer_level: number
  ranking_position: number
  recent_referrals: Array<{
    first_name: string
    municipality: string | null
    created_at: string
  }>
}

interface RankingEntry {
  referrer_name: string | null
  total_referrals: number
  ranking: number
}

export function ReferralPanel({ config, slug }: { config: ReferralConfig; slug: string }) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<ReferrerStats | null>(null)
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const levelNames = Array.isArray(config.level_names)
    ? config.level_names
    : ['Simpatizante', 'Activista', 'Defensor', 'Líder', 'Embajador']

  const handleSearch = async () => {
    if (phone.length < 10) {
      setError('Ingrese un número de celular válido')
      return
    }

    setLoading(true)
    setError('')

    const supabase = getSupabase()
    const normalizedCode = normalizePhone(phone)

    const [statsRes, rankingRes] = await Promise.all([
      supabase.rpc('get_referrer_stats', {
        p_campaign_id: config.campaign_id,
        p_referrer_code: normalizedCode,
      }),
      supabase.rpc('get_referral_ranking', {
        p_campaign_id: config.campaign_id,
        p_limit: 5,
      }),
    ])

    if (statsRes.data?.[0]) {
      setStats(statsRes.data[0])
    } else {
      setStats(null)
    }

    setRanking(rankingRes.data || [])
    setSearched(true)
    setLoading(false)
  }

  const referralLink = stats
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://unete.scrutix.co'}/${slug}?ref=${normalizePhone(phone)}`
    : ''

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/${slug}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al registro
      </Link>

      {/* Search card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Mis Referidos</h1>
        <p className="text-sm text-slate-500 mb-4">
          Ingresa tu celular para ver tu progreso y referidos.
        </p>

        <div className="flex gap-2">
          <div className="flex-1 flex items-center border border-slate-300 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
            <span className="px-3 py-2.5 bg-slate-50 text-slate-500 text-sm border-r border-slate-300">
              +57
            </span>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="300 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-3 py-2.5 text-sm outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: config.primary_color }}
          >
            {loading ? '...' : <Search className="w-4 h-4" />}
          </button>
        </div>

        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>

      {/* Stats card */}
      {searched && stats && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${config.primary_color}15` }}
            >
              <Star className="w-6 h-6" style={{ color: config.primary_color }} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">
                {stats.referrer_name || 'Sin nombre'}
              </h2>
              <p className="text-sm" style={{ color: config.primary_color }}>
                Nivel {stats.referrer_level}: {levelNames[stats.referrer_level - 1] || 'Simpatizante'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.total_referrals}</p>
              <p className="text-xs text-slate-500">Referidos</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-slate-900">#{stats.ranking_position}</p>
              <p className="text-xs text-slate-500">Posición</p>
            </div>
          </div>

          {/* Recent referrals */}
          {stats.recent_referrals.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Últimos referidos</h3>
              <div className="space-y-2">
                {stats.recent_referrals.map((ref, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-700">{ref.first_name}</span>
                    <span className="text-xs text-slate-400">{ref.municipality || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Share */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Tu enlace personal</h3>
            <ShareButton
              referralLink={referralLink}
              slug={slug}
              primaryColor={config.primary_color}
              message={config.whatsapp_share_message}
            />
          </div>
        </div>
      )}

      {searched && !stats && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">
            No encontramos ese número en nuestra base. Verifica que esté escrito correctamente o regístrate como simpatizante para recibir tu link personal.
          </p>
          <Link
            href={`/${slug}`}
            className="inline-block mt-3 text-sm font-medium hover:underline"
            style={{ color: config.primary_color }}
          >
            Registrarme ahora
          </Link>
        </div>
      )}

      {/* Ranking */}
      {ranking.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-slate-900">Top Captadores</h2>
          </div>
          <div className="space-y-3">
            {ranking.map((entry, i) => (
              <div key={i} className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0
                      ? 'bg-amber-100 text-amber-700'
                      : i === 1
                      ? 'bg-slate-200 text-slate-600'
                      : i === 2
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {entry.ranking}
                </span>
                <span className="flex-1 text-sm text-slate-700 font-medium">
                  {entry.referrer_name || 'Anónimo'}
                </span>
                <span className="text-sm text-slate-500">
                  {entry.total_referrals} ref.
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
