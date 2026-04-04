import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function isImpersonating(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.has('civicos_impersonation')
}

export async function getImpersonationInfo() {
  const cookieStore = await cookies()
  const raw = cookieStore.get('civicos_impersonation')?.value
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export async function rejectIfImpersonating(): Promise<NextResponse | null> {
  if (await isImpersonating()) {
    return NextResponse.json(
      { error: 'Accion no permitida en modo soporte' },
      { status: 403 }
    )
  }
  return null
}
