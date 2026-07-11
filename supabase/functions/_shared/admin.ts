import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyInitData, type TelegramUser } from './telegram.ts'

// Сервисный клиент (service_role) — только внутри edge functions.
export function serviceClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })
}

// Проверяет подпись Telegram + наличие пользователя в таблице admins.
// Возвращает { user } если админ, иначе { error, status }.
export async function requireAdmin(
  req: Request,
  sb: SupabaseClient,
): Promise<{ user: TelegramUser } | { error: string; status: number }> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
  if (!botToken) return { error: 'Bot token not configured', status: 500 }

  const initData = req.headers.get('x-telegram-init-data') ?? ''
  const user = await verifyInitData(initData, botToken)
  if (!user) return { error: 'Unauthorized', status: 401 }

  const { data } = await sb
    .from('admins')
    .select('telegram_id')
    .eq('telegram_id', user.id)
    .maybeSingle()
  if (!data) return { error: 'Forbidden', status: 403 }

  return { user }
}
