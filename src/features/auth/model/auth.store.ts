import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/_shared/supabase/client'
import { isSupabaseConfigured } from '@/_shared/supabase/isConfigured'

// Авторизация приложения: вход email+пароль (Supabase Auth).
// Просмотр публичный; is_admin определяет, показывать ли редактирование.
// Роль выдаёт супер-админ через Telegram-бота (см. supabase/functions/bot).
export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null)
  const isAdmin = ref(false)
  const isReady = ref(false) // инициализация завершена — гардам можно доверять isAdmin

  const user = computed(() => session.value?.user ?? null)
  const email = computed(() => user.value?.email ?? null)
  const isAuthed = computed(() => !!session.value)

  async function loadProfile(): Promise<void> {
    if (!session.value) {
      isAdmin.value = false
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.value.user.id)
      .maybeSingle()
    isAdmin.value = !!data?.is_admin
  }

  async function init(): Promise<void> {
    // Dev без бэка (фикстуры): превью edit-режима через ?admin=1, как раньше.
    if (!isSupabaseConfigured) {
      const params = new URLSearchParams(location.search)
      if (params.get('admin') === '1') localStorage.setItem('dev.admin', '1')
      if (params.get('admin') === '0') localStorage.removeItem('dev.admin')
      isAdmin.value = localStorage.getItem('dev.admin') === '1'
      isReady.value = true
      return
    }

    const { data } = await supabase.auth.getSession()
    session.value = data.session
    await loadProfile()

    // Реагируем на вход/выход/refresh токена в любой вкладке.
    supabase.auth.onAuthStateChange((_event, next) => {
      session.value = next
      void loadProfile()
    })

    isReady.value = true
  }

  async function login(emailValue: string, password: string): Promise<void> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailValue.trim(),
      password,
    })
    if (error) throw new Error(mapAuthError(error.message))
    // Ставим сессию и грузим профиль СИНХРОННО (не ждём onAuthStateChange),
    // чтобы isAdmin был свежим до редиректа на защищённый роут.
    session.value = data.session
    await loadProfile()
  }

  async function register(emailValue: string, password: string): Promise<void> {
    const { data, error } = await supabase.auth.signUp({ email: emailValue.trim(), password })
    if (error) throw new Error(mapAuthError(error.message))
    session.value = data.session
    await loadProfile()
  }

  async function logout(): Promise<void> {
    await supabase.auth.signOut()
    session.value = null
    isAdmin.value = false
  }

  return { session, user, email, isAuthed, isAdmin, isReady, init, login, register, logout }
})

// Английские сообщения Supabase → человеческие русские.
function mapAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login')) return 'Неверная почта или пароль'
  if (m.includes('already registered') || m.includes('already exists'))
    return 'Эта почта уже зарегистрирована'
  if (m.includes('password') && m.includes('at least'))
    return 'Пароль слишком короткий (минимум 6 символов)'
  if (m.includes('valid email') || m.includes('invalid email'))
    return 'Проверьте адрес почты'
  return message || 'Что-то пошло не так, попробуйте ещё раз'
}
