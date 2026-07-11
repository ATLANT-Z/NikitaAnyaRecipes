// POST /recipe-upsert  { recipe: RecipeDto }  → сохранённый RecipeDto
// Только для Telegram-админа.
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
interface RecipeIn {
  id: string
  title: string
  category_slug: string
  cover_url: string | null
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

  // Рецепт
  const upsertRecipe = await sb.from('recipes').upsert({
    id: recipe.id,
    title: recipe.title,
    category_slug: recipe.category_slug,
    cover_url: recipe.cover_url,
    time_minutes: recipe.time_minutes,
  })
  if (upsertRecipe.error) return json({ error: upsertRecipe.error.message }, 500)

  // Секции: полностью заменяем (проще и надёжнее для нашей модели).
  await sb.from('recipe_sections').delete().eq('recipe_id', recipe.id)
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
      'id, title, category_slug, cover_url, time_minutes, sections:recipe_sections(id, title, sort_order, servings, cost, kbju, ingredients, substitutions, steps, storage)',
    )
    .eq('id', recipe.id)
    .single()
  if (error) return json({ error: error.message }, 500)

  return json(data)
})
