import { createClient } from '@supabase/supabase-js'

// Единственный клиент Supabase на всё приложение.
// anon-ключ безопасно живёт на фронте: чтение ограничено RLS.
// ЧТЕНИЕ рецептов — публичное. ЗАПИСИ идут через Edge Functions с проверкой
// админа по Supabase-JWT (сессия входа email+пароль).
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Не роняем приложение в деве без .env — просто предупреждаем.
  console.warn('[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY не заданы (.env)')
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  // Храним сессию входа в localStorage и сами обновляем токен.
  auth: { persistSession: true, autoRefreshToken: true },
})
