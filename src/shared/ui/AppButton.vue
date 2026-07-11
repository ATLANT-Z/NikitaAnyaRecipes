<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

interface Props {
  variant?: 'primary' | 'soft' | 'ghost' | 'dashed'
  type?: 'button' | 'submit'
  loading?: boolean
  disabled?: boolean
  block?: boolean
}
const props = withDefaults(defineProps<Props>(), { variant: 'primary', type: 'button' })
</script>

<template>
  <button
    :type="type"
    class="btn"
    :class="[`btn--${props.variant}`, { 'btn--block': block }]"
    :disabled="disabled || loading"
  >
    <Loader2 v-if="loading" :size="16" class="btn__spin" />
    <slot />
  </button>
</template>

<style scoped lang="scss">
@use 'sass:color';

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 20px;
  min-height: 44px;
  border-radius: $radius-pill;
  font-weight: 700;
  font-size: 15px;
  @include anim(transform);
  transition-property: transform, background-color, box-shadow, border-color;

  &:active:not(:disabled) {
    transform: scale(0.97);
  }
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  &--block {
    width: 100%;
  }

  &--primary {
    background: $color-accent;
    color: #fff;
    box-shadow: $shadow-soft;
    &:hover:not(:disabled) {
      background: color.adjust($color-accent, $lightness: -6%);
    }
  }
  &--soft {
    background: $color-surface;
    color: $color-text;
    box-shadow: $shadow-soft;
    &:hover:not(:disabled) {
      background: $color-surface-2;
    }
  }
  &--ghost {
    background: transparent;
    color: $color-muted;
    &:hover:not(:disabled) {
      background: $color-surface-2;
      color: $color-text;
    }
  }
  &--dashed {
    background: transparent;
    color: $color-muted;
    border: 1.5px dashed $color-border;
    &:hover:not(:disabled) {
      color: $color-text;
      border-color: $color-accent;
    }
  }

  &__spin {
    animation: btn-spin 1s linear infinite;
  }
}
@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
