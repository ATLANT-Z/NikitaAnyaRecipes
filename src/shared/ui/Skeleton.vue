<script setup lang="ts">
// Шиммер-плейсхолдер на время загрузки. Размеры задаём пропсами/классом.
interface Props {
  width?: string
  height?: string
  radius?: string
}
withDefaults(defineProps<Props>(), { width: '100%', height: '16px' })
</script>

<template>
  <span class="skeleton" :style="{ width, height, borderRadius: radius }" />
</template>

<style scoped lang="scss">
.skeleton {
  display: block;
  background: linear-gradient(
    100deg,
    $color-surface-2 30%,
    color-mix(in srgb, $color-surface-2 40%, #fff) 50%,
    $color-surface-2 70%
  );
  background-size: 200% 100%;
  border-radius: $radius-sm;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}
</style>
