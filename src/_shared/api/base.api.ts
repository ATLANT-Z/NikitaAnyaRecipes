import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from '@/_shared/supabase/client'
import { TelegramHelper } from '@/_shared/telegram/telegram'
import { AppError, type StatusError } from '@/_shared/api/errors'

// Базовый класс api-слоя. Два транспорта:
//  • ЧТЕНИЕ  — напрямую через supabase-js (this.sb.from(...).select()),
//             результат снимаем через BaseApi.unwrap().
//  • ЗАПИСЬ  — через Edge Function (this._fn), с проверкой Telegram-админа
//             на сервере. service_role-ключ никогда не покидает сервер.
export default abstract class BaseApi {
  protected readonly sb = supabase

  // Снять { data, error } от supabase → чистые данные или AppError.
  protected static unwrap<T>(res: { data: T | null; error: PostgrestError | null }): T {
    if (res.error) {
      console.error('[supabase] read error:', res.error)
      throw new AppError(500, res.error.message)
    }
    return res.data as T
  }

  // Вызов Edge Function. initData Telegram уходит в заголовке для проверки
  // подписи + прав администратора на сервере. Ошибку бросаем как StatusError,
  // чтобы её мог поймать ErrorHelper.map(SE._4xx(...)).
  protected async _fn<T>(name: string, body: Record<string, unknown> = {}): Promise<T> {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    const res = await fetch(`${baseUrl}/functions/v1/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
        'X-Telegram-Init-Data': TelegramHelper.initData,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const message = await res.text().catch(() => '')
      const err: StatusError = { status: res.status, message }
      throw err
    }

    // Функция может вернуть пустое тело (204) — тогда undefined.
    const text = await res.text()
    return (text ? JSON.parse(text) : undefined) as T
  }
}
