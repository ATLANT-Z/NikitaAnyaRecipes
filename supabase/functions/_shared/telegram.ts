// Проверка подписи Telegram WebApp initData (без внешних зависимостей, Web Crypto).
// Алгоритм: secret = HMAC_SHA256(key="WebAppData", msg=botToken);
//           hash   = HMAC_SHA256(key=secret,       msg=dataCheckString).

async function hmac(keyData: Uint8Array, msg: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg))
  return new Uint8Array(sig)
}

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export interface TelegramUser {
  id: number
  first_name?: string
  username?: string
}

// Возвращает пользователя, если подпись валидна и свежая; иначе null.
export async function verifyInitData(
  initData: string,
  botToken: string,
  maxAgeSec = 86400,
): Promise<TelegramUser | null> {
  if (!initData) return null
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return null
  params.delete('hash')

  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n')

  const enc = new TextEncoder()
  const secret = await hmac(enc.encode('WebAppData'), botToken)
  const computed = toHex(await hmac(secret, dataCheckString))
  if (computed !== hash) return null

  // Защита от повторного использования старых initData.
  const authDate = Number(params.get('auth_date') ?? 0)
  if (maxAgeSec > 0 && Date.now() / 1000 - authDate > maxAgeSec) return null

  try {
    return JSON.parse(params.get('user') ?? 'null') as TelegramUser
  } catch {
    return null
  }
}

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-telegram-init-data',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
