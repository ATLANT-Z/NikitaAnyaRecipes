import { useQuery } from '@tanstack/vue-query'
import { categoriesRepository } from '@/repository/categories.repository'

export function useCategories() {
  const query = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesRepository.list(),
  })

  return {
    categories: query.data, // CategoryDto[] | undefined
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
