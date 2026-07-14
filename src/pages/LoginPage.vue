<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, LogIn } from 'lucide-vue-next'
import { useAuthStore } from '@/features/auth/model/auth.store'
import { useNotificationsStore } from '@/_shared/stores/notifications'
import AppScreen from '@/shared/ui/AppScreen.vue'
import AppHeader from '@/shared/ui/AppHeader.vue'
import IconButton from '@/shared/ui/IconButton.vue'
import AppButton from '@/shared/ui/AppButton.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const notifications = useNotificationsStore()

const mode = ref<'login' | 'register'>('login')
const email = ref('')
const password = ref('')
const isBusy = ref(false)
const error = ref('')

const title = computed(() => (mode.value === 'login' ? 'Вход' : 'Регистрация'))

function switchMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  error.value = ''
}

async function onSubmit() {
  error.value = ''
  if (!email.value.trim() || !password.value) {
    error.value = 'Заполните почту и пароль'
    return
  }
  if (password.value.length < 6) {
    error.value = 'Пароль минимум 6 символов'
    return
  }

  isBusy.value = true
  try {
    if (mode.value === 'login') await auth.login(email.value, password.value)
    else await auth.register(email.value, password.value)

    notifications.success(mode.value === 'login' ? 'С возвращением!' : 'Аккаунт создан')
    const redirect = (route.query.redirect as string) || '/'
    router.replace(redirect)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не получилось, попробуйте ещё раз'
  } finally {
    isBusy.value = false
  }
}
</script>

<template>
  <AppScreen>
    <AppHeader :title="title">
      <template #left>
        <IconButton label="Назад" @click="router.back()">
          <ChevronLeft :size="24" />
        </IconButton>
      </template>
    </AppHeader>

    <form class="login" @submit.prevent="onSubmit">
      <p class="login__hint">
        Вход нужен только чтобы редактировать рецепты. Просто смотреть можно без входа.
      </p>

      <div class="smart-field">
        <span class="smart-field__label">Почта</span>
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          inputmode="email"
          placeholder="you@example.com"
        />
      </div>

      <div class="smart-field">
        <span class="smart-field__label">Пароль</span>
        <input
          v-model="password"
          type="password"
          :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
          placeholder="минимум 6 символов"
        />
      </div>

      <span v-if="error" class="login__error">{{ error }}</span>

      <AppButton variant="primary" block type="submit" :loading="isBusy">
        <LogIn :size="18" /> {{ mode === 'login' ? 'Войти' : 'Зарегистрироваться' }}
      </AppButton>

      <button type="button" class="login__switch" @click="switchMode">
        {{ mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти' }}
      </button>
    </form>
  </AppScreen>
</template>

<style scoped lang="scss">
.login {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 420px;
  margin: 8px auto 0;

  &__hint {
    font-size: 14px;
    line-height: 1.4;
    color: $color-muted;
  }

  &__error {
    font-size: 13px;
    line-height: 1.35;
    color: $color-danger;
  }

  &__switch {
    align-self: center;
    margin-top: 4px;
    font-size: 14px;
    font-weight: 700;
    color: $color-accent;
    @include anim(color);
    &:hover {
      color: color-mix(in srgb, $color-accent 70%, $color-text);
    }
  }
}
</style>
