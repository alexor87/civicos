import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const BUCKET = 'campaign-images'

// Service-role storage client — uses @supabase/supabase-js directly (no SSR cookie injection)
// This ensures the service_role key is actually used for storage operations
function getAdminStorage() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  ).storage
}

export async function POST(request: NextRequest) {
  // Auth check using user's session (SSR client reads cookies correctly)
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

  const adminStorage = getAdminStorage()

  // Ensure bucket exists — idempotent, ignores "already exists" error
  await adminStorage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 5242880,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  })

  // M-7: validate magic bytes — browser-supplied MIME type is user-controlled
  const buffer = Buffer.from(await file.arrayBuffer())
  const bytes = new Uint8Array(buffer)
  const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF
  const isPng  = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47
  const isWebp = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  const isGif  = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46
  if (!isJpeg && !isPng && !isWebp && !isGif) {
    return NextResponse.json({ error: 'Formato de imagen no válido' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${user.id}/${Date.now()}.${ext}`

  const { error: uploadError } = await adminStorage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = adminStorage
    .from(BUCKET)
    .getPublicUrl(path)

  return NextResponse.json({ url: publicUrl })
}
