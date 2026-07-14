<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Toaster } from 'vue-sonner'
import GlobalModals from '@/_shared/components/modals/GlobalModals.vue'
import { modalService } from '@/services/modal.service'

// Сессия входа восстанавливается в main.ts до маунта (см. useAuthStore().init()).
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition name="page" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>

  <GlobalModals :service="modalService" />
  <Toaster position="top-center" :duration="3200" rich-colors />
</template>

<style scoped lang="scss">
.page-enter-active,
.page-leave-active {
  transition:
    opacity $anim ease,
    transform $anim $ease-soft;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
