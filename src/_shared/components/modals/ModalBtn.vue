<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

interface Props {
  variant?: 'default' | 'primary' | 'ghost' | 'danger'
  type?: 'button' | 'submit'
  loading?: boolean
  disabled?: boolean
}
const props = withDefaults(defineProps<Props>(), { variant: 'default', type: 'button' })
</script>

<template>
  <button
    :type="type"
    class="modal__btn"
    :class="props.variant !== 'default' && `modal__btn--${props.variant}`"
    :disabled="disabled || loading"
  >
    <Loader2 v-if="loading" :size="15" class="modal__spin" />
    <slot />
  </button>
</template>
