import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { COUNTRY_TO_LOCALE, DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, isValidLocale } from '@/lib/i18n'

const PUBLIC_PATHS = ['/login', '/register', '/auth/callback', '/auth/impersonate', '/registro', '/welcome']

/** Matches /en, /es, /co (with or without trailing path) */
const LOCALE_PATTERN = new RegExp(`^/(${LOCALES.join('|')})(/|$)`)

function isLocaleMarketingRoute(pathname: string) {
  return LOCALE_PATTERN.test(pathname)
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ── 1. Root path → geolocation redirect ────────────────────────────
  if (pathname === '/') {
    const host = request.headers.get('host') || ''

    // app.scrutix.co → directo al login, no landing
    if (host.startsWith('app.')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Respect user's saved preference
    const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value
    if (cookieLocale && isValidLocale(cookieLocale)) {
      return NextResponse.redirect(new URL(`/${cookieLocale}`, request.url))
    }

    // Detect country from Vercel/Cloudflare header
    const country =
      request.headers.get('x-vercel-ip-country') ||
      request.headers.get('cf-ipcountry') ||
      ''
    const locale = COUNTRY_TO_LOCALE[country] ?? DEFAULT_LOCALE

    const response = NextResponse.redirect(new URL(`/${locale}`, request.url))
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })
    return response
  }

  // ── 2. Locale marketing pages → no auth needed ─────────────────────
  if (isLocaleMarketingRoute(pathname)) {
    const host = request.headers.get('host') || ''
    if (host.startsWith('app.')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // ── 2b. scrutix.co apex → rutas de app viven en app.scrutix.co ────
  const apexHost = request.headers.get('host') || ''
  const isApex = apexHost === 'scrutix.co' || apexHost === 'www.scrutix.co'
  if (isApex) {
    const url = new URL(request.url)
    url.host = 'app.scrutix.co'
    url.protocol = 'https:'
    url.port = ''
    return NextResponse.redirect(url, 301)
  }

  // ── 3. Everything else → Supabase auth (unchanged) ─────────────────
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p))

  // Redirect unauthenticated to login
  if (!user && !isPublicPath) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    supabaseResponse.cookies.getAll().forEach(cookie => {
      response.cookies.set(cookie.name, cookie.value, cookie)
    })
    return response
  }

  // Redirect authenticated users away from auth pages
  if (user && isPublicPath && pathname !== '/auth/callback' && pathname !== '/auth/impersonate' && pathname !== '/welcome') {
    const response = NextResponse.redirect(new URL('/dashboard', request.url))
    supabaseResponse.cookies.getAll().forEach(cookie => {
      response.cookies.set(cookie.name, cookie.value, cookie)
    })
    return response
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
