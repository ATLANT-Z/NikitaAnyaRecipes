import { createClient, type SupabaseClient, type User } from 'https://esm.sh/@supabase/supabase-js@2'

// Сервисный клиент (service_role) — только внутри edge functions.
export function serviceClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })
}

// Достаёт пользователя из Supabase-JWT (заголовок Authorization: Bearer <token>).
async function userFromRequest(req: Request, sb: SupabaseClient): Promise<User | null> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data, error } = await sb.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

// Требует залогиненного админа приложения (profiles.is_admin = true).
// Возвращает { user } либо { error, status }.
export async function requireAdmin(
  req: Request,
  sb: SupabaseClient,
): Promise<{ user: User } | { error: string; status: number }> {
  const user = await userFromRequest(req, sb)
  if (!user) return { error: 'Unauthorized', status: 401 }

  const { data: profile } = await sb
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.is_admin) return { error: 'Forbidden', status: 403 }

  return { user }
}

// Проверка супер-админа для бота (Telegram id есть в super_admins).
export async function isSuperAdmin(sb: SupabaseClient, telegramId: number): Promise<boolean> {
  const { data } = await sb
    .from('super_admins')
    .select('telegram_id')
    .eq('telegram_id', telegramId)
    .maybeSingle()
  return !!data
}
