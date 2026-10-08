// POST /category-delete  { slug }  → { ok: true }
// Только для админа. Непустую категорию не удаляем (409) — рецепты ссылаются на slug.
import { serviceClient, requireAdmin } from '../_shared/admin.ts'
import { cors, json } from '../_shared/telegram.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const sb = serviceClient()
  const auth = await requireAdmin(req, sb)
  if ('error' in auth) return json({ error: auth.error }, auth.status)

  const { slug } = (await req.json()) as { slug: string }
  if (!slug) return json({ error: 'Invalid slug' }, 422)

  const { count, error: countError } = await sb
    .from('recipes')
    .select('id', { count: 'exact', head: true })
    .eq('category_slug', slug)
  if (countError) return json({ error: countError.message }, 500)
  if (count && count > 0) return json({ error: 'Category not empty' }, 409)

  const { error } = await sb.from('categories').delete().eq('slug', slug)
  if (error) return json({ error: error.message }, 500)

  return json({ ok: true })
})
