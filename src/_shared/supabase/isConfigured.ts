// Есть ли реальные ключи Supabase. Пока false — репозитории отдают локальные
// фикстуры, чтобы приложение было кликабельным без бэкенда (см. docs/tech-debt.md #1).
// Появятся ключи в .env → станет true, и данные пойдут из Supabase автоматически.
export const isSupabaseConfigured =
  !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY
