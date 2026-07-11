// Минимальный тип Telegram WebApp — только то, что реально используем.
// Полный SDK грузится через telegram-web-app.js (см. index.html).
export interface TelegramWebAppUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
}

export interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    user?: TelegramWebAppUser
  }
  colorScheme: 'light' | 'dark'
  ready: () => void
  expand: () => void
  close: () => void
  MainButton: unknown
  themeParams: Record<string, string>
}
