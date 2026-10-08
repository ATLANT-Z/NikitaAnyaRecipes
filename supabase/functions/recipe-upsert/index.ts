// POST /recipe-upsert  { recipe: RecipeDto }  → сохранённый RecipeDto
// Только для админа (JWT сессии + profiles.is_admin).
// cover_url сервер выводит сам: первое фото галереи (images[0]).
import { serviceClient, requireAdmin } from '../_shared/admin.ts'
import { cors, json } from '../_shared/telegram.ts'

interface SectionIn {
  id: string
  title: string
  sort_order: number
  servings: string | null
  cost: number | null
  kbju: unknown
  ingredients: unknown
  substitutions: unknown
  steps: unknown
  storage: unknown
}
interface ImageIn {
  id: string
  url: string
}
interface RecipeIn {
  id: string
  title: string
  category_slug: string
  images?: ImageIn[]
  time_minutes: number
  sections: SectionIn[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const sb = serviceClient()
  const auth = await requireAdmin(req, sb)
  if ('error' in auth) return json({ error: auth.error }, auth.status)

  const { recipe } = (await req.json()) as { recipe: RecipeIn }
  if (!recipe?.title || !recipe.category_slug) return json({ error: 'Invalid recipe' }, 422)

  // Галерея: оставляем только валидные { id, url }, порядок — как прислали.
  const images = (Array.isArray(recipe.images) ? recipe.images : [])
    .filter((i) => i && typeof i.url === 'string' && i.url)
    .map((i) => ({ id: String(i.id), url: i.url }))

  // Рецепт
  const upsertRecipe = await sb.from('recipes').upsert({
    id: recipe.id,
    title: recipe.title,
    category_slug: recipe.category_slug,
    images,
    cover_url: images[0]?.url ?? null,
    time_minutes: recipe.time_minutes,
  })
  // 23503 — нет такой категории (FK): это ошибка заполнения, а не сервера.
  if (upsertRecipe.error) {
    return json({ error: upsertRecipe.error.message }, upsertRecipe.error.code === '23503' ? 422 : 500)
  }

  // Секции: полностью заменяем (проще и надёжнее для нашей модели).
  const delSections = await sb.from('recipe_sections').delete().eq('recipe_id', recipe.id)
  if (delSections.error) return json({ error: delSections.error.message }, 500)
  if (recipe.sections?.length) {
    const rows = recipe.sections.map((s) => ({
      id: s.id,
      recipe_id: recipe.id,
      title: s.title,
      sort_order: s.sort_order,
      servings: s.servings,
      cost: s.cost,
      kbju: s.kbju,
      ingredients: s.ingredients,
      substitutions: s.substitutions,
      steps: s.steps,
      storage: s.storage,
    }))
    const insertSections = await sb.from('recipe_sections').insert(rows)
    if (insertSections.error) return json({ error: insertSections.error.message }, 500)
  }

  // Возвращаем свежий рецепт целиком.
  const { data, error } = await sb
    .from('recipes')
    .select(
      'id, title, category_slug, cover_url, images, time_minutes, sections:recipe_sections(id, title, sort_order, servings, cost, kbju, ingredients, substitutions, steps, storage)',
    )
    .eq('id', recipe.id)
    .single()
  if (error) return json({ error: error.message }, 500)

  return json(data)
})
