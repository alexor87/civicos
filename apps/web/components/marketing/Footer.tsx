import { Shield, Globe } from 'lucide-react'

interface FooterDict {
  columns: Record<string, { label: string; href: string }[]>
  copyright: string
  badges: string[]
}

export default function Footer({ dict }: { dict: FooterDict }) {
  return (
    <footer className="border-t border-[#E5E7EB] bg-white py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Link columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {Object.entries(dict.columns).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0F0F11]">
                {category}
              </h4>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-[#6B7280] transition-colors hover:text-[#0F0F11]"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#E5E7EB] pt-8 sm:flex-row">
          <p className="text-xs text-[#6B7280]">
            {dict.copyright}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B7280]">
            {dict.badges[0] && (
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {dict.badges[0]}
              </span>
            )}
            {dict.badges[1] && (
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {dict.badges[1]}
              </span>
            )}
            {dict.badges.slice(2).map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
