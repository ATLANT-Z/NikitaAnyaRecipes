import { computed } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { recipesRepository } from '@/repository/recipes.repository'
import type { RecipeDto } from '@/api/recipes/resources/recipe.resource'
import { useHandleError } from '@/_shared/composables/useHandleError'

export function useRecipeSave() {
  const qc = useQueryClient()
  const { handleError } = useHandleError()

  const saveMutation = useMutation({
    mutationFn: (recipe: RecipeDto) => recipesRepository.save(recipe),
    onError: handleError,
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ['recipe', saved.id] })
      qc.invalidateQueries({ queryKey: ['recipes'] })
    },
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => recipesRepository.remove(id),
    onError: handleError,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  })

  return {
    save: (recipe: RecipeDto) => saveMutation.mutateAsync(recipe),
    remove: (id: string) => removeMutation.mutateAsync(id),
    isSaving: computed(() => saveMutation.isPending.value),
    isRemoving: computed(() => removeMutation.isPending.value),
  }
}
