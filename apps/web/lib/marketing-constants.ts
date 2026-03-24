// ── Scrutix Marketing Website Constants ──────────────────────────────────

export const SITE = {
  name: 'Scrutix',
  tagline: 'The Operating System for Modern Campaigns',
  description:
    'Scrutix is the all-in-one electoral campaign platform with AI agents, voter CRM, field operations, and multichannel communications. Used by 180+ campaigns in 12 countries.',
}

export const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Integrations', href: '#integrations' },
  { label: 'Blog', href: '#' },
]

export const METRICS = [
  { value: '2.4M+', label: 'Voter contacts managed' },
  { value: '180+', label: 'Campaigns powered' },
  { value: '94%', label: 'Field coverage rate achieved' },
]

export const PAIN_POINTS = [
  {
    title: 'Scattered data',
    description:
      'A CRM here, spreadsheets there, WhatsApp everywhere. No single source of truth.',
    icon: 'Layers' as const,
  },
  {
    title: 'No intelligence',
    description:
      "Data gets collected but never becomes action. Your team guesses instead of acts.",
    icon: 'BrainCircuit' as const,
  },
  {
    title: 'Field blindness',
    description:
      "You don't know what's happening on the ground until it's too late to react.",
    icon: 'EyeOff' as const,
  },
]

export const FEATURES = [
  {
    id: 'operations',
    title: 'Campaign Operations',
    subtitle: 'Everything your campaign needs in one place',
    items: [
      'Unified voter CRM with smart segmentation',
      'Canvassing & field ops with offline mobile app',
      'Email, SMS, WhatsApp — all in one inbox',
      'Geographic mapping & territory management with PostGIS',
      'Complete volunteer management & scheduling',
    ],
  },
  {
    id: 'intelligence',
    title: 'AI Intelligence',
    subtitle: 'The brain behind your campaign',
    items: [
      '6 AI Agents automating campaign workflows',
      'Intelligence Center with real-time proactive suggestions',
      'Predictive voter scoring and engagement analysis',
      'Content generation aligned with your platform',
      'Human-in-the-loop for every critical decision',
    ],
  },
  {
    id: 'mobile',
    title: 'Mobile Field App',
    subtitle: 'Your team, everywhere — even offline',
    items: [
      'Native iOS + Android (Kotlin Multiplatform)',
      'Offline-first: operates up to 72h without connectivity',
      'Configurable conversation scripts for volunteers',
      'Auto-sync when signal returns',
      'Downloadable offline maps by zone',
    ],
  },
]

export const AI_AGENTS = [
  {
    name: 'Contact Intelligence',
    description: 'Qualifies and enriches new contacts automatically',
    icon: 'UserCheck' as const,
  },
  {
    name: 'Field Follow-up',
    description: 'Schedules canvassing retries and escalates cold contacts',
    icon: 'MapPin' as const,
  },
  {
    name: 'Smart Communications',
    description: 'Optimizes send times, generates A/B variants, monitors drops',
    icon: 'Send' as const,
  },
  {
    name: 'Territory Optimizer',
    description: 'Redistributes volunteers to maximize coverage before election day',
    icon: 'Map' as const,
  },
  {
    name: 'Campaign Monitor',
    description: 'Daily briefing, anomaly detection, corrective action suggestions',
    icon: 'BarChart3' as const,
  },
  {
    name: 'Content Generator',
    description: 'Drafts speeches, scripts, and messages aligned to your platform',
    icon: 'PenTool' as const,
  },
]

export const INTEGRATIONS = [
  { name: 'WhatsApp Business', icon: 'MessageCircle' as const },
  { name: 'SendGrid', icon: 'Mail' as const },
  { name: 'Twilio SMS', icon: 'Smartphone' as const },
  { name: 'Mapbox', icon: 'MapPin' as const },
  { name: 'Anthropic Claude', icon: 'BrainCircuit' as const },
  { name: 'Supabase', icon: 'Database' as const },
  { name: 'Google Workspace', icon: 'Chrome' as const },
  { name: 'Slack', icon: 'Hash' as const, badge: 'Soon' },
]

export const PRICING_PLANS = [
  {
    name: 'Starter',
    price: '$49',
    period: '/mo',
    description: 'Small local campaigns',
    features: [
      'Up to 5,000 contacts',
      '5 team members',
      'Email & SMS campaigns',
      'Basic canvassing',
      'Standard reporting',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$199',
    period: '/mo',
    description: 'Growing campaigns',
    features: [
      'Up to 25,000 contacts',
      '20 team members',
      '3 active races',
      '2 AI agents included',
      'Advanced segmentation',
      'Territory management',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Campaign',
    price: '$499',
    period: '/mo',
    description: 'Full-scale operations',
    features: [
      'Unlimited contacts',
      'Unlimited team members',
      'All 6 AI agents',
      'Intelligence Center',
      'Mobile field app',
      'Priority support',
      'Custom integrations',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Parties & consultancies',
    features: [
      'Multiple campaigns',
      'Dedicated infrastructure',
      'SSO & SAML',
      'SLA guarantee',
      'Onboarding & training',
      'Custom AI workflows',
      'White-label option',
    ],
    cta: 'Talk to Sales',
    highlighted: false,
  },
]

export const TESTIMONIALS = [
  {
    quote:
      'We went from 3 disconnected tools to one platform. Our field coverage went up 40% in the first month.',
    name: 'María González',
    role: 'Campaign Manager',
    location: 'Colombia 2025',
  },
  {
    quote:
      'The AI suggestions are the real game changer. It flagged a drop in engagement in our northern districts before we even noticed.',
    name: 'James Whitfield',
    role: 'Political Consultant',
    location: 'Miami',
  },
  {
    quote:
      "Finally a platform built for how campaigns actually work — not how software companies think they work.",
    name: 'Ana Ferreira',
    role: 'Director of Operations',
    location: 'Portugal 2024',
  },
]

export const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Integrations', href: '#integrations' },
    { label: 'Changelog', href: '#' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Press', href: '#' },
  ],
  Resources: [
    { label: 'Documentation', href: '#' },
    { label: 'API', href: '#' },
    { label: 'Status', href: '#' },
    { label: 'Security', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'GDPR', href: '#' },
  ],
}
