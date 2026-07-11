import { defineStore } from 'pinia'
import { toast } from 'vue-sonner'

// Store-фасад над vue-sonner. Сохраняем API success/error/info, на который
// опирается портированный код (модалки, useHandleError). Рендер тостов —
// <Toaster /> из vue-sonner (см. App.vue).
export const useNotificationsStore = defineStore('notifications', () => {
  function success(msg: string) {
    toast.success(msg)
  }
  function error(msg: string) {
    toast.error(msg)
  }
  function info(msg: string) {
    toast(msg)
  }
  return { success, error, info }
})
