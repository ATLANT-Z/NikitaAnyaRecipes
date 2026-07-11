import { createClient } from '@supabase/supabase-js'

// Единственный клиент Supabase на всё приложение.
// anon-ключ безопасно живёт на фронте: доступ ограничен RLS (только чтение).
// Все ЗАПИСИ идут не отсюда, а через Edge Functions с проверкой админа.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Не роняем приложение в деве без .env — просто предупреждаем.
  console.warn('[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY не заданы (.env)')
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: { persistSession: false },
})
