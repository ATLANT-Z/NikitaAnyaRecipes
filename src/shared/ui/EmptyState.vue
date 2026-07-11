<script setup lang="ts">
import LotusMark from '@/shared/ui/decor/LotusMark.vue'

defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <div class="empty">
    <LotusMark :size="56" />
    <p class="empty__title">{{ title }}</p>
    <p v-if="subtitle" class="empty__subtitle">{{ subtitle }}</p>
    <div v-if="$slots.default" class="empty__action">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  padding: 48px 24px;
  color: $color-muted;

  &__title {
    font-family: 'Comfortaa', sans-serif;
    font-size: 17px;
    font-weight: 600;
    color: $color-text;
  }
  &__subtitle {
    font-size: 14px;
    max-width: 32ch;
  }
  &__action {
    margin-top: 12px;
  }
}
</style>
