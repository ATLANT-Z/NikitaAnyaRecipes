// Вебхук Telegram-бота. Главная команда: /me_admin {ключ} — делает отправителя
// админом, если ключ совпал с секретом ADMIN_SECRET.
//
// Настройка вебхука (один раз):
//   https://api.telegram.org/bot<TOKEN>/setWebhook?url=<PROJECT>/functions/v1/bot
import { serviceClient } from '../_shared/admin.ts'

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

  const [command, ...rest] = msg.text.trim().split(/\s+/)

  if (command === '/start') {
    await reply(
      msg.chat.id,
      'Привет! Это книга рецептов 🌿 Открой мини-приложение, чтобы готовить.',
    )
    return new Response('ok')
  }

  if (command === '/me_admin') {
    const key = rest.join(' ')
    const secret = Deno.env.get('ADMIN_SECRET')
    if (!secret || key !== secret) {
      await reply(msg.chat.id, 'Неверный ключ 🙈')
      return new Response('ok')
    }
    const sb = serviceClient()
    const { error } = await sb.from('admins').upsert({ telegram_id: msg.from.id })
    await reply(
      msg.chat.id,
      error ? 'Не получилось, попробуй позже' : 'Готово! Теперь ты можешь редактировать рецепты ✍️',
    )
    return new Response('ok')
  }

  return new Response('ok')
})
