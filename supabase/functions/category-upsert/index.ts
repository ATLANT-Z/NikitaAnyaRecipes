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

// Транслит теряет различия (ь/ъ, ё/е): занятый адрес получает номер —
// brat → brat-2 → brat-3. Копия SlugHelper.unique с фронта.
function uniqueSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base
  for (let n = 2; ; n++) {
    const suffix = `-${n}`
    const candidate = base.slice(0, 40 - suffix.length).replace(/-+$/, '') + suffix
    if (!taken.has(candidate)) return candidate
  }
}

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

  let slug = existing?.slug ?? category.slug
  if (!/^[a-z0-9-]{1,40}$/.test(slug ?? '')) return json({ error: 'Invalid slug' }, 422)

  // Новая категория: если адрес занят — берём свободный с номером.
  // (Категорий единицы — читаем все slug разом.)
  if (!existing) {
    const { data: rows, error: slugsError } = await sb.from('categories').select('slug')
    if (slugsError) return json({ error: slugsError.message }, 500)
    slug = uniqueSlug(slug, new Set((rows ?? []).map((r: { slug: string }) => r.slug)))
  }

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
