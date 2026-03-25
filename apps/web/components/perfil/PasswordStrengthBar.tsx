'use client'

interface Props {
  password: string
}

function getStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: 'bg-slate-200' }

  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (password.length >= 12) score++

  if (score <= 1) return { score: 1, label: 'Débil', color: 'bg-red-500' }
  if (score <= 2) return { score: 2, label: 'Regular', color: 'bg-orange-500' }
  if (score <= 3) return { score: 3, label: 'Buena', color: 'bg-yellow-500' }
  if (score <= 4) return { score: 4, label: 'Fuerte', color: 'bg-green-500' }
  return { score: 5, label: 'Muy fuerte', color: 'bg-emerald-600' }
}

export function PasswordStrengthBar({ password }: Props) {
  const { score, label, color } = getStrength(password)

  if (!password) return null

  const requirements = [
    { met: password.length >= 8, text: 'Mínimo 8 caracteres' },
    { met: /[A-Z]/.test(password), text: 'Al menos 1 mayúscula' },
    { met: /\d/.test(password), text: 'Al menos 1 número' },
  ]

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className={`flex-1 rounded-full transition-colors ${i <= score ? color : 'bg-slate-200'}`}
            />
          ))}
        </div>
        <span className="text-xs font-medium text-slate-600 min-w-[80px] text-right">{label}</span>
      </div>

      <ul className="space-y-1">
        {requirements.map(req => (
          <li key={req.text} className={`text-xs flex items-center gap-1.5 ${req.met ? 'text-green-600' : 'text-slate-400'}`}>
            <span>{req.met ? '✓' : '○'}</span>
            {req.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
