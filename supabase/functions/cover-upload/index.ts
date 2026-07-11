// POST /cover-upload  { path, contentType, dataBase64 }  → { url }
// Заливает обложку в бакет recipe-covers (service_role, минуя RLS) и отдаёт
// публичный URL. Только для Telegram-админа.
import { serviceClient, requireAdmin } from '../_shared/admin.ts'
import { cors, json } from '../_shared/telegram.ts'

const BUCKET = 'recipe-covers'
const MAX_BYTES = 5 * 1024 * 1024 // 5 МБ

interface UploadIn {
  path: string
  contentType: string
  dataBase64: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const sb = serviceClient()
  const auth = await requireAdmin(req, sb)
  if ('error' in auth) return json({ error: auth.error }, auth.status)

  const { path, contentType, dataBase64 } = (await req.json()) as UploadIn
  if (!path || !dataBase64) return json({ error: 'Invalid upload' }, 422)

  // base64 → байты.
  let bytes: Uint8Array
  try {
    const binary = atob(dataBase64)
    bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  } catch {
    return json({ error: 'Bad base64' }, 422)
  }
  if (bytes.byteLength > MAX_BYTES) return json({ error: 'File too large' }, 413)

  // Путь чистим до «папка/имя.ext» — без обхода директорий.
  const safePath = path.replace(/[^a-zA-Z0-9._/-]/g, '_').replace(/\.{2,}/g, '.')

  const up = await sb.storage.from(BUCKET).upload(safePath, bytes, {
    contentType: contentType || 'image/jpeg',
    upsert: true,
  })
  if (up.error) return json({ error: up.error.message }, 500)

  const { data } = sb.storage.from(BUCKET).getPublicUrl(safePath)
  return json({ url: data.publicUrl })
})
