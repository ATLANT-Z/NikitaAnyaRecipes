import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { recipesRepository } from '@/repository/recipes.repository'
import { useFavorites } from '@/features/favorites/model/useFavorites'

const MOSAIC_MAX = 4

// Плитка категории собирается из обложек её блюд: сперва избранные, затем свежие.
// Один лёгкий запрос на всё меню (бережём лимиты Supabase) — раскладываем по slug.
// Ключ ['recipes', ...] попадает под инвалидацию после сохранения рецепта.
export function useCategoryCovers() {
  const {
    data: { favoriteIds },
  } = useFavorites()

  const query = useQuery({
    queryKey: ['recipes', 'covers'],
    queryFn: () => recipesRepository.listCovers(),
  })

  const coversBySlug = computed(() => {
    const map = new Map<string, string[]>()
    const rows = query.data.value ?? []
    const favs = favoriteIds.value
    // Стабильная сортировка сохраняет порядок «сначала новые», избранные всплывают вверх.
    const ordered = [...rows].sort((a, b) => Number(favs.has(b.id)) - Number(favs.has(a.id)))
    for (const row of ordered) {
      const list = map.get(row.category_slug)
      if (!list) map.set(row.category_slug, [row.cover_url])
      else if (list.length < MOSAIC_MAX) list.push(row.cover_url)
    }
    return map
  })

  return { coversBySlug }
}
