// Вебхук Telegram-бота. Бот — инструмент СУПЕР-АДМИНА (тебя).
//
//   /me_admin {ключ}   — стать супер-админом (ключ = ADMIN_SECRET).
//   /users             — список зарегистрированных пользователей (email + статус).
//   /grant {email}     — выдать админку (редактирование рецептов).
//   /revoke {email}    — забрать админку.
//
// Обычные пользователи входят в приложении по email+паролю. Супер-админ раздаёт
// им права этими командами. Настройка вебхука (один раз):
//   https://api.telegram.org/bot<TOKEN>/setWebhook?url=<PROJECT>/functions/v1/bot
import { serviceClient, isSuperAdmin } from '../_shared/admin.ts'

interface TgMessage {
  chat: { id: number }
  from?: { id: number; first_name?: string }
  text?: string
}
interface TgUpdate {
  message?: TgMessage
}

async function reply(chatId: number, text: string): Promise<void> {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')!
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok')

  const update = (await req.json()) as TgUpdate
  const msg = update.message
  if (!msg?.text || !msg.from) return new Response('ok')

  const fromId = msg.from.id
  const [command, ...rest] = msg.text.trim().split(/\s+/)
  const arg = rest.join(' ').trim()
  const sb = serviceClient()

  if (command === '/start') {
    await reply(msg.chat.id, 'Привет! Это книга рецептов 🌿 Открой приложение, чтобы готовить.')
    return new Response('ok')
  }

  // Стать супер-админом по секретному ключу.
  if (command === '/me_admin') {
    const secret = Deno.env.get('ADMIN_SECRET')
    if (!secret || arg !== secret) {
      await reply(msg.chat.id, 'Неверный ключ 🙈')
      return new Response('ok')
    }
    const { error } = await sb.from('super_admins').upsert({ telegram_id: fromId })
    await reply(
      msg.chat.id,
      error
        ? 'Не получилось, попробуй позже'
        : 'Готово! Ты супер-админ. Команды: /users, /grant email, /revoke email',
    )
    return new Response('ok')
  }

  // Дальше — только для супер-админа.
  const superAdmin = await isSuperAdmin(sb, fromId)
  if (!superAdmin) {
    await reply(msg.chat.id, 'Команда доступна только супер-админу.')
    return new Response('ok')
  }

  if (command === '/users') {
    const { data, error } = await sb
      .from('profiles')
      .select('email, is_admin')
      .order('created_at', { ascending: true })
      .limit(100)
    if (error) {
      await reply(msg.chat.id, 'Не удалось получить список.')
      return new Response('ok')
    }
    if (!data?.length) {
      await reply(msg.chat.id, 'Пока никто не зарегистрировался.')
      return new Response('ok')
    }
    const lines = data.map((u) => `${u.is_admin ? '✅' : '▫️'} ${u.email ?? '—'}`)
    await reply(msg.chat.id, `Пользователи:\n${lines.join('\n')}\n\n/grant email · /revoke email`)
    return new Response('ok')
  }

  if (command === '/grant' || command === '/revoke') {
    const email = arg.toLowerCase()
    if (!email) {
      await reply(msg.chat.id, `Укажи email: ${command} anya@example.com`)
      return new Response('ok')
    }
    const isAdmin = command === '/grant'
    const { data, error } = await sb
      .from('profiles')
      .update({ is_admin: isAdmin })
      .eq('email', email)
      .select('email')
    if (error) {
      await reply(msg.chat.id, 'Ошибка при обновлении.')
      return new Response('ok')
    }
    if (!data?.length) {
      await reply(msg.chat.id, `Не нашёл пользователя с email ${email}. Пусть сначала зарегистрируется.`)
      return new Response('ok')
    }
    await reply(msg.chat.id, isAdmin ? `Выдал админку: ${email} ✍️` : `Забрал админку: ${email}`)
    return new Response('ok')
  }

  await reply(msg.chat.id, 'Команды: /users, /grant email, /revoke email')
  return new Response('ok')
})
