<script setup lang="ts">
// Мобильный контейнер экрана: центрированная колонка + safe-area отступы.
</script>

<template>
  <main class="app-screen">
    <div class="app-screen__inner">
      <slot />
    </div>
  </main>
</template>

<style scoped lang="scss">
.app-screen {
  min-height: 100dvh;
  @include safe-top(12px);
  @include safe-bottom(24px);
  padding-inline: 16px;

  &__inner {
    width: 100%;
    max-width: $content-max;
    margin: 0 auto;
  }
}
</style>
