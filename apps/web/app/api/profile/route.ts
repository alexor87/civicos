import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_FIELDS = [
  'full_name', 'short_name', 'phone', 'custom_title',
  'department_code', 'municipality_code', 'locality_name', 'neighborhood_name',
  'language', 'timezone', 'theme_mode', 'font_size',
] as const

const VALID_LANGUAGES = ['es_CO', 'es', 'en']
const VALID_THEMES = ['light', 'dark', 'system']
const VALID_FONT_SIZES = ['normal', 'large', 'x-large']

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Filter to allowed fields only
  const updates: Record<string, unknown> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in body) updates[key] = body[key]
  }

  // Handle preferences (notifications toggle)
  if ('preferences' in body && typeof body.preferences === 'object' && body.preferences !== null) {
    updates.preferences = body.preferences
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  // Validations
  if (updates.full_name !== undefined) {
    const name = String(updates.full_name).trim()
    if (name.split(/\s+/).length < 2 || name.length > 100) {
      return NextResponse.json({ error: 'El nombre debe tener al menos 2 palabras y máximo 100 caracteres' }, { status: 400 })
    }
    updates.full_name = name
  }

  if (updates.short_name !== undefined && updates.short_name !== null) {
    if (String(updates.short_name).length > 30) {
      return NextResponse.json({ error: 'El nombre corto no puede superar 30 caracteres' }, { status: 400 })
    }
  }

  if (updates.custom_title !== undefined && updates.custom_title !== null) {
    if (String(updates.custom_title).length > 100) {
      return NextResponse.json({ error: 'El cargo no puede superar 100 caracteres' }, { status: 400 })
    }
  }

  if (updates.phone !== undefined && updates.phone !== null) {
    const phone = String(updates.phone).trim()
    if (phone && !/^\+\d{7,15}$/.test(phone)) {
      return NextResponse.json({ error: 'El teléfono debe estar en formato E.164 (ej: +573001234567)' }, { status: 400 })
    }
    updates.phone = phone || null
  }

  if (updates.language !== undefined && !VALID_LANGUAGES.includes(String(updates.language))) {
    return NextResponse.json({ error: 'Idioma no válido' }, { status: 400 })
  }

  if (updates.theme_mode !== undefined && !VALID_THEMES.includes(String(updates.theme_mode))) {
    return NextResponse.json({ error: 'Modo de tema no válido' }, { status: 400 })
  }

  if (updates.font_size !== undefined && !VALID_FONT_SIZES.includes(String(updates.font_size))) {
    return NextResponse.json({ error: 'Tamaño de fuente no válido' }, { status: 400 })
  }

  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
