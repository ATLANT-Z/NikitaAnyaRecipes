<script setup lang="ts">
// Плавающая шапка экрана: слева слот (назад/меню), по центру опц. заголовок,
// справа слот действий (поиск/карандаш/+). Sticky, с safe-area сверху.
defineProps<{ title?: string }>()
</script>

<template>
  <header class="app-header">
    <div class="app-header__side app-header__side--left">
      <slot name="left" />
    </div>

    <h1 v-if="title" class="app-header__title">{{ title }}</h1>
    <div v-else class="app-header__spacer" />

    <div class="app-header__side app-header__side--right">
      <slot name="right" />
    </div>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 60px;
  @include safe-top(8px);
  padding-bottom: 8px;

  // Лёгкое «растворение» контента под шапкой при скролле.
  &::before {
    content: '';
    position: absolute;
    inset: -20px 0 0;
    background: linear-gradient(180deg, $color-page-bg 55%, transparent);
    z-index: -1;
    pointer-events: none;
  }

  &__side {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    &--right {
      margin-left: auto;
    }
  }

  &__title {
    font-size: 20px;
    font-weight: 700;
    @include clamp-lines(1);
  }

  &__spacer {
    flex: 1;
  }
}
</style>
