<script setup lang="ts">
// Круглая мягкая кнопка-иконка для шапки (назад, поиск, карандаш, +).
interface Props {
  label: string
  variant?: 'surface' | 'ghost'
}
withDefaults(defineProps<Props>(), { variant: 'surface' })
</script>

<template>
  <button type="button" class="icon-btn" :class="`icon-btn--${variant}`" :aria-label="label">
    <slot />
  </button>
</template>

<style scoped lang="scss">
.icon-btn {
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-pill;
  color: $color-text;
  @include anim(transform);
  transition-property: transform, background-color, box-shadow;

  &--surface {
    background: $color-surface;
    box-shadow: $shadow-soft;
  }
  &--ghost {
    background: transparent;
  }

  &:hover {
    background: $color-surface;
    box-shadow: $shadow-card;
  }
  &:active {
    transform: scale(0.92);
  }
}
</style>
