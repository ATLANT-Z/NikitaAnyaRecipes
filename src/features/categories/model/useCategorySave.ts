import { computed } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { categoriesRepository } from '@/repository/categories.repository'
import type { CategoryDto } from '@/api/categories/resources/category.resource'
import { useHandleError } from '@/_shared/composables/useHandleError'

// Создание/правка/удаление категорий. После мутации — инвалидация списка,
// плитки на главной и выпадающий список в редакторе рецепта обновятся сами.
export function useCategorySave() {
  const qc = useQueryClient()
  const { handleError } = useHandleError()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['categories'] })

  const saveMutation = useMutation({
    mutationFn: (category: CategoryDto) => categoriesRepository.save(category),
    onError: handleError,
    onSuccess: invalidate,
  })

  const removeMutation = useMutation({
    mutationFn: (slug: string) => categoriesRepository.remove(slug),
    onError: handleError,
    onSuccess: invalidate,
  })

  return {
    actions: {
      save: (category: CategoryDto) => saveMutation.mutateAsync(category),
      remove: (slug: string) => removeMutation.mutateAsync(slug),
    },
    isSaving: computed(() => saveMutation.isPending.value),
    isRemoving: computed(() => removeMutation.isPending.value),
  }
}
