import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { recipesRepository } from '@/repository/recipes.repository'

// Список рецептов категории.
export function useRecipeList(slug: MaybeRefOrGetter<string>) {
  const query = useQuery({
    queryKey: ['recipes', 'by-category', computed(() => toValue(slug))],
    queryFn: () => recipesRepository.listByCategory(toValue(slug)),
  })

  return {
    recipes: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
