// POST /verify-admin  → { isAdmin, user }
// Фронт вызывает при старте внутри Telegram, чтобы понять, показывать ли карандаш.
import { serviceClient, requireAdmin } from '../_shared/admin.ts'
import { cors, json } from '../_shared/telegram.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const sb = serviceClient()
  const auth = await requireAdmin(req, sb)
  if ('error' in auth) {
    // 401/403 — не админ, но это не «ошибка» для фронта: просто isAdmin=false.
    return json({ isAdmin: false })
  }
  return json({ isAdmin: true, user: auth.user })
})
