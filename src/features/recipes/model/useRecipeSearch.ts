import { ref } from 'vue'
import { refDebounced } from '@vueuse/core'
import { useQuery } from '@tanstack/vue-query'
import { recipesRepository } from '@/repository/recipes.repository'

// Поиск рецептов по названию. Ввод дебаунсим, чтобы не спамить запросами.
export function useRecipeSearch() {
  const term = ref('')
  const debounced = refDebounced(term, 300)

  const query = useQuery({
    queryKey: ['recipes', 'search', debounced],
    queryFn: () => recipesRepository.search(debounced.value),
    enabled: () => debounced.value.trim().length > 0,
  })

  return {
    term, // v-model поля поиска
    results: query.data,
    isLoading: query.isFetching,
  }
}
