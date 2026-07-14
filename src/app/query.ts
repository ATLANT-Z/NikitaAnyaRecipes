import { VueQueryPlugin, type VueQueryPluginOptions, QueryClient } from '@tanstack/vue-query'

// «One-shot» стратегия: запрос живёт вечно свежим (staleTime: Infinity), поэтому
// при обычной навигации ре-фетча нет — бережём лимиты Supabase.
// Обновление — только вручную: invalidateQueries после мутации помечает запрос
// stale, и он ре-фетчится при следующем маунте страницы (refetchOnMount: true).
// ВАЖНО: refetchOnMount тут именно true — иначе инвалидация неактивных запросов
// (напр. список категории, когда мы ушли на другой экран) не срабатывает, и после
// создания рецепта категория показывает устаревший кэш.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: true,
      retry: 1,
    },
  },
})

export const vueQuery: [typeof VueQueryPlugin, VueQueryPluginOptions] = [
  VueQueryPlugin,
  { queryClient },
]
