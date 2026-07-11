import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API } from '@/api/api'
import { TelegramHelper } from '@/_shared/telegram/telegram'
import { isSupabaseConfigured } from '@/_shared/supabase/isConfigured'

// Права админа + режим редактирования.
//
// Реальная проверка (Telegram initData → таблица admins через edge function
// verify-admin) появится на этапе 6. Пока для превью edit-режима без Telegram
// есть dev-переключатель:
//   • открыть приложение с ?admin=1 — включит режим админа (сохранится);
//   • очистить localStorage['dev.admin'] — выключит.
// На проде это заменит настоящая проверка. См. docs/tech-debt.md #2.
export const useEditModeStore = defineStore('edit-mode', () => {
  const params = new URLSearchParams(location.search)
  if (params.get('admin') === '1') localStorage.setItem('dev.admin', '1')
  if (params.get('admin') === '0') localStorage.removeItem('dev.admin')

  const isAdmin = ref(localStorage.getItem('dev.admin') === '1')

  // Реальная проверка внутри Telegram: verify-admin (initData → admins).
  async function initFromTelegram() {
    if (!TelegramHelper.isTelegram || !isSupabaseConfigured) return
    try {
      if (await API.Admin.verify()) isAdmin.value = true
    } catch {
      // тихо: не админ / нет сети — остаёмся read-only
    }
  }

  // Зарезервировано под будущее inline-редактирование прямо на экранах.
  const isEditing = ref(false)
  function toggleEditing() {
    if (isAdmin.value) isEditing.value = !isEditing.value
  }
  function stopEditing() {
    isEditing.value = false
  }

  return { isAdmin, isEditing, initFromTelegram, toggleEditing, stopEditing }
})
