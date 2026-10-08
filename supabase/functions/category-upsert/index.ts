// POST /category-upsert  { category: CategoryDto }  → сохранённая CategoryDto
// Только для админа (JWT сессии + profiles.is_admin).
// slug существующей категории не меняем: он — адрес /c/<slug> и ключ рецептов.
import { serviceClient, requireAdmin } from '../_shared/admin.ts'
import { cors, json } from '../_shared/telegram.ts'

interface CategoryIn {
  id: string
  slug: string
  title: string
  sort_order: number
  image_url: string | null
}

const SELECT = 'id, slug, title, sort_order, image_url'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const sb = serviceClient()
  const auth = await requireAdmin(req, sb)
  if ('error' in auth) return json({ error: auth.error }, auth.status)

  const { category } = (await req.json()) as { category: CategoryIn }
  const title = category?.title?.trim()
  if (!category?.id || !title) return json({ error: 'Invalid category' }, 422)

  const { data: existing } = await sb
    .from('categories')
    .select('slug')
    .eq('id', category.id)
    .maybeSingle()

  const slug = existing?.slug ?? category.slug
  if (!/^[a-z0-9-]{1,40}$/.test(slug ?? '')) return json({ error: 'Invalid slug' }, 422)

  const { data, error } = await sb
    .from('categories')
    .upsert({
      id: category.id,
      slug,
      title,
      sort_order: Number(category.sort_order) || 0,
      image_url: category.image_url || null,
    })
    .select(SELECT)
    .single()

  // 23505 — нарушение unique (такой slug уже занят другой категорией).
  if (error) return json({ error: error.message }, error.code === '23505' ? 409 : 500)
  return json(data)
})
