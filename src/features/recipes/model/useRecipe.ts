import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { recipesRepository } from '@/repository/recipes.repository'

// Один рецепт целиком (со всеми секциями).
export function useRecipe(id: MaybeRefOrGetter<string>) {
  const query = useQuery({
    queryKey: ['recipe', computed(() => toValue(id))],
    queryFn: () => recipesRepository.get(toValue(id)),
  })

  return {
    recipe: query.data, // RecipeDto | undefined
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
