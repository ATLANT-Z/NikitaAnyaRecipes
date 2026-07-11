import type { TelegramWebApp, TelegramWebAppUser } from './telegram.types'

// Тонкая обёртка над Telegram WebApp. На обычном сайте window.Telegram?.WebApp
// либо отсутствует, либо initData пустой → isTelegram() === false, и приложение
// работает в read-only режиме.
export class TelegramHelper {
  static get webApp(): TelegramWebApp | undefined {
    return window.Telegram?.WebApp
  }

  // Мы «внутри Telegram», только если пришёл непустой initData
  // (именно он подписан и проверяется на сервере).
  static get isTelegram(): boolean {
    return !!TelegramHelper.webApp?.initData
  }

  static get initData(): string {
    return TelegramHelper.webApp?.initData ?? ''
  }

  static get user(): TelegramWebAppUser | null {
    return TelegramHelper.webApp?.initDataUnsafe.user ?? null
  }

  // Разворачиваем на весь экран + сигнал «готово» (убирает лоадер Telegram).
  static init(): void {
    const wa = TelegramHelper.webApp
    if (!wa) return
    wa.ready()
    wa.expand()
  }
}
