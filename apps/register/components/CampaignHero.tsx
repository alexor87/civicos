'use client'

import Image from 'next/image'
import { toEmbedUrl } from '@/lib/utils'

interface CampaignHeroProps {
  logoUrl?: string | null
  videoUrl?: string | null
  headerImageUrl?: string | null
  title?: string | null
  welcomeText?: string | null
  primaryColor: string
}

export function CampaignHero({
  logoUrl,
  videoUrl,
  headerImageUrl,
  title,
  welcomeText,
  primaryColor,
}: CampaignHeroProps) {
  const embedUrl = videoUrl ? toEmbedUrl(videoUrl) : null

  return (
    <div className="w-full -mx-6 -mt-6">
      {/* Hero media with gradient overlay */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: '200px' }}>
        {embedUrl ? (
          <div className="relative w-full aspect-video">
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Video de campaña"
            />
          </div>
        ) : headerImageUrl ? (
          <>
            <Image
              src={headerImageUrl}
              alt="Imagen de campaña"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-transparent" />
          </>
        ) : (
          <div
            className="w-full h-52"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd, ${primaryColor}88)`,
            }}
          />
        )}

        {/* Logo floating on hero */}
        {logoUrl && !embedUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/90 shadow-xl bg-white backdrop-blur-sm">
              <Image
                src={logoUrl}
                alt="Logo de campaña"
                width={96}
                height={96}
                className="object-cover w-full h-full"
                priority
              />
            </div>
          </div>
        )}
      </div>

      {/* Logo below video */}
      {logoUrl && embedUrl && (
        <div className="flex justify-center -mt-10 mb-2 relative z-10">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
            <Image
              src={logoUrl}
              alt="Logo de campaña"
              width={80}
              height={80}
              className="object-cover w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Title, welcome text and counter */}
      <div className="px-6 pt-6 pb-2 text-center">
        {title && (
          <h1
            className="text-2xl sm:text-3xl font-bold mb-2 animate-fade-in-up"
            style={{ color: primaryColor }}
          >
            {title}
          </h1>
        )}

        {welcomeText && (
          <p className="text-slate-600 mb-4 max-w-sm mx-auto animate-fade-in-up-delay-1">
            {welcomeText}
          </p>
        )}

      </div>
    </div>
  )
}
