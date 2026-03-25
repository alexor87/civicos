import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const BUCKET = 'avatars'
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function getAdminStorage() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  ).storage
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Solo se aceptan JPG, PNG y WebP' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'La imagen no puede superar 5MB' }, { status: 400 })
  }

  const adminStorage = getAdminStorage()

  // Ensure bucket exists
  await adminStorage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_SIZE,
    allowedMimeTypes: ALLOWED_TYPES,
  })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${user.id}/avatar.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  // Delete old avatar files for this user (clean up previous uploads)
  const { data: existingFiles } = await adminStorage.from(BUCKET).list(user.id)
  if (existingFiles && existingFiles.length > 0) {
    await adminStorage.from(BUCKET).remove(existingFiles.map(f => `${user.id}/${f.name}`))
  }

  // Upload new avatar
  const { error: uploadError } = await adminStorage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = adminStorage.from(BUCKET).getPublicUrl(path)

  // Update profile with new avatar URL
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ url: publicUrl })
}
