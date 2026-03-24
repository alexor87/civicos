import Nav from '@/components/marketing/Nav'
import Hero from '@/components/marketing/Hero'
import LogoBar from '@/components/marketing/LogoBar'
import Problem from '@/components/marketing/Problem'
import Features from '@/components/marketing/Features'
import AIAgents from '@/components/marketing/AIAgents'
import Integrations from '@/components/marketing/Integrations'
import Pricing from '@/components/marketing/Pricing'
import Testimonials from '@/components/marketing/Testimonials'
import FinalCTA from '@/components/marketing/FinalCTA'
import Footer from '@/components/marketing/Footer'

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Nav />
      <Hero />
      <LogoBar />
      <Problem />
      <Features />
      <AIAgents />
      <Integrations />
      <Pricing />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </main>
  )
}
