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
    <div className="w-full">
      {/* Video or Image Hero */}
      {embedUrl ? (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-6">
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Video de campaña"
          />
        </div>
      ) : headerImageUrl ? (
        <div className="relative w-full h-48 sm:h-64 rounded-xl overflow-hidden mb-6">
          <Image
            src={headerImageUrl}
            alt="Imagen de campaña"
            fill
            className="object-cover"
            priority
          />
        </div>
      ) : (
        <div
          className="w-full h-32 rounded-xl mb-6"
          style={{ backgroundColor: primaryColor }}
        />
      )}

      {/* Logo */}
      {logoUrl && (
        <div className="flex justify-center -mt-12 mb-4 relative z-10">
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

      {/* Title and welcome text */}
      {title && (
        <h1
          className="text-2xl sm:text-3xl font-bold text-center mb-2"
          style={{ color: primaryColor }}
        >
          {title}
        </h1>
      )}
      {welcomeText && (
        <p className="text-center text-slate-600 mb-6 max-w-md mx-auto">
          {welcomeText}
        </p>
      )}
    </div>
  )
}
