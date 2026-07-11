import { AppError } from '@/_shared/api/errors'
import { useNotificationsStore } from '@/_shared/stores/notifications'

// Единая обработка ошибок в onError мутаций / catch-блоках.
// AppError → человеческое сообщение; всё прочее → общий текст.
export function useHandleError() {
  const notifications = useNotificationsStore()

  function handleError(err: unknown) {
    if (err instanceof AppError) {
      notifications.error(err.message)
      return
    }
    console.error('[unhandled error]', err)
    notifications.error('Что-то пошло не так, попробуйте ещё раз')
  }

  return { handleError }
}
