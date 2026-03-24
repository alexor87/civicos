import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Scrutix — The Operating System for Modern Campaigns',
  description:
    'Scrutix is the all-in-one electoral campaign platform with AI agents, voter CRM, field operations, and multichannel communications. Used by 180+ campaigns in 12 countries.',
  keywords: [
    'electoral campaign software',
    'campaign management platform',
    'political CRM',
    'canvassing app',
    'AI campaign tools',
  ],
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
