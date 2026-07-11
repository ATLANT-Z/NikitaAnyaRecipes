<script setup lang="ts">
import ModalCard from '@/_shared/components/modals/ModalCard.vue'
import ModalBtn from '@/_shared/components/modals/ModalBtn.vue'
import { useModal } from '@/services/modal.service'

// Универсальная модалка подтверждения. Результат — boolean (подтвердил/нет).
interface Props {
  title: string
  message?: string
  confirmText?: string
  danger?: boolean
}
withDefaults(defineProps<Props>(), { confirmText: 'Подтвердить' })

const { resolve, close } = useModal('confirm')
</script>

<template>
  <ModalCard :title="title" @close="close">
    <p v-if="message" class="confirm__msg">{{ message }}</p>
    <template #footer>
      <ModalBtn variant="ghost" @click="resolve(false)">Отмена</ModalBtn>
      <ModalBtn :variant="danger ? 'danger' : 'primary'" @click="resolve(true)">
        {{ confirmText }}
      </ModalBtn>
    </template>
  </ModalCard>
</template>

<style scoped lang="scss">
.confirm__msg {
  font-size: 15px;
  line-height: 1.45;
  color: $color-muted;
}
</style>
