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
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between bg-[#132f56] p-10">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded-lg bg-[#2960ec] flex items-center justify-center">
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
                <div className="w-8 h-8 rounded-md bg-[#2960ec]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-white/80" />
                </div>
                <span className="text-white/70 text-sm leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Social proof footer */}
        <p className="text-white/40 text-xs">
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
