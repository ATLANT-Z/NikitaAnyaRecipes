import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import { router } from '@/app/router'
import { vueQuery } from '@/app/query'
import { modalService, ModalServiceKey } from '@/services/modal.service'
import { TelegramHelper } from '@/_shared/telegram/telegram'
import { useAuthStore } from '@/features/auth/model/auth.store'
import '@/assets/scss/index.scss'
import 'vue-sonner/style.css'

// Инициализируем Telegram Mini App (на обычном сайте — no-op).
TelegramHelper.init()

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(...vueQuery)
app.provide(ModalServiceKey, modalService)

// Восстанавливаем сессию входа ДО маунта — чтобы гарды сразу знали, админ ли мы.
// Монтируем в любом случае (даже если восстановление упало).
useAuthStore()
  .init()
  .finally(() => app.mount('#app'))
