import { VueQueryPlugin, type VueQueryPluginOptions, QueryClient } from '@tanstack/vue-query'

// «One-shot» стратегия: запрос выполняется один раз и живёт вечно свежим.
// Никаких авто-рефетчей при фокусе/реконнекте/маунте — бережём лимиты Supabase.
// Обновление данных — только вручную (invalidateQueries после правки).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
})

export const vueQuery: [typeof VueQueryPlugin, VueQueryPluginOptions] = [
  VueQueryPlugin,
  { queryClient },
]
