import { computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { favoritesRepository } from '@/repository/favorites.repository'
import { useHandleError } from '@/_shared/composables/useHandleError'

const FAVORITES_KEY = ['favorites'] as const

// Избранное общее. Кэш vue-query шарится по всему приложению (один queryKey),
// поэтому все карточки видят одно состояние. Тоггл — оптимистичный.
export function useFavorites() {
  const qc = useQueryClient()
  const { handleError } = useHandleError()

  const query = useQuery({
    queryKey: FAVORITES_KEY,
    queryFn: () => favoritesRepository.list(),
  })

  const ids = computed(() => new Set(query.data.value ?? []))
  const isFavorite = (id: string) => ids.value.has(id)

  const toggleMutation = useMutation({
    mutationFn: (vars: { id: string; value: boolean }) =>
      favoritesRepository.setFavorite(vars.id, vars.value),
    onMutate: async ({ id, value }) => {
      await qc.cancelQueries({ queryKey: FAVORITES_KEY })
      const prev = qc.getQueryData<string[]>(FAVORITES_KEY) ?? []
      const next = value ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)
      qc.setQueryData(FAVORITES_KEY, next)
      return { prev }
    },
    onError: (err, _vars, ctx) => {
      if (ctx) qc.setQueryData(FAVORITES_KEY, ctx.prev)
      handleError(err)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: FAVORITES_KEY }),
  })

  function toggle(id: string) {
    toggleMutation.mutate({ id, value: !isFavorite(id) })
  }

  return {
    data: { favoriteIds: ids, isFavorite },
    actions: { toggle },
  }
}
