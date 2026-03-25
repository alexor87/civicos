import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { currentPassword?: string; newPassword?: string; confirmPassword?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { currentPassword, newPassword, confirmPassword } = body

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: 'Las contraseñas no coinciden' }, { status: 400 })
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }

  if (!/[A-Z]/.test(newPassword)) {
    return NextResponse.json({ error: 'La contraseña debe contener al menos una mayúscula' }, { status: 400 })
  }

  if (!/\d/.test(newPassword)) {
    return NextResponse.json({ error: 'La contraseña debe contener al menos un número' }, { status: 400 })
  }

  // Verify current password by attempting a sign-in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  })

  if (signInError) {
    return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 400 })
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
