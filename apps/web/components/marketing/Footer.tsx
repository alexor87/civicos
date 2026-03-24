import { Shield, Globe } from 'lucide-react'
import { FOOTER_LINKS } from '@/lib/marketing-constants'

export default function Footer() {
  return (
    <footer className="border-t border-[#E5E7EB] bg-white py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Link columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
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
            &copy; 2026 Scrutix. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B7280]">
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              SOC 2
            </span>
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              GDPR Compliant
            </span>
            <span>Powered by Anthropic Claude</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
