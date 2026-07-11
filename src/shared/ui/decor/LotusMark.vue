<script setup lang="ts">
// Мелкий декоративный лотос (восточный мотив, вайшнавская эстетика).
// SVG — потому что маленький, векторный, легко перекрашивается через currentColor.
withDefaults(defineProps<{ size?: number }>(), { size: 48 })
</script>

<template>
  <svg
    class="lotus"
    :width="size"
    :height="size"
    viewBox="0 0 64 64"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M32 40c-6 0-11-4-11-4s2-9 11-9 11 9 11 9-5 4-11 4Z"
      fill="currentColor"
      opacity="0.9"
    />
    <path
      d="M32 41c-9 0-17-6-17-6s3 12 17 12 17-12 17-12-8 6-17 6Z"
      fill="currentColor"
      opacity="0.55"
    />
    <path d="M32 39c-4-5-4-13 0-19 4 6 4 14 0 19Z" fill="currentColor" opacity="0.75" />
    <path d="M32 40c-6-3-9-9-10-15 6 2 10 7 10 15Z" fill="currentColor" opacity="0.6" />
    <path d="M32 40c6-3 9-9 10-15-6 2-10 7-10 15Z" fill="currentColor" opacity="0.6" />
  </svg>
</template>

<style scoped lang="scss">
.lotus {
  color: $color-peach;
}
</style>
