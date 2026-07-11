// POST /recipe-delete  { id }  → 204. Только для Telegram-админа.
import { serviceClient, requireAdmin } from '../_shared/admin.ts'
import { cors, json } from '../_shared/telegram.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const sb = serviceClient()
  const auth = await requireAdmin(req, sb)
  if ('error' in auth) return json({ error: auth.error }, auth.status)

  const { id } = (await req.json()) as { id: string }
  if (!id) return json({ error: 'id required' }, 422)

  // Секции удалятся каскадом (on delete cascade).
  const { error } = await sb.from('recipes').delete().eq('id', id)
  if (error) return json({ error: error.message }, 500)

  return new Response(null, { status: 204, headers: cors })
})
