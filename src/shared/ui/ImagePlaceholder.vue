<script setup lang="ts">
// Заглушка под будущую картинку. По ТЗ: div с фоном-цветом + рабочим классом,
// чтобы позже заменить на <img class="image-ph"> без правки раскладки.
// `tone` выбирает мягкий градиент из палитры. `hint` — текстовое описание сути
// картинки (что тут будет), видно только при пустой заглушке.
interface Props {
  src?: string | null
  tone?: 'sky' | 'meadow' | 'sun' | 'peach' | 'lavender' | 'neutral'
  hint?: string
  alt?: string
}
withDefaults(defineProps<Props>(), { tone: 'neutral' })
</script>

<template>
  <img v-if="src" class="image-ph image-ph--real" :src="src" :alt="alt ?? ''" loading="lazy" />
  <div v-else class="image-ph" :class="`image-ph--${tone}`" role="img" :aria-label="alt ?? hint">
    <span v-if="hint" class="image-ph__hint">{{ hint }}</span>
  </div>
</template>

<style scoped lang="scss">
.image-ph {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  // Мягкие акварельные градиенты-заглушки (пока нет фото).
  &--neutral {
    background: linear-gradient(135deg, $color-surface-2, $color-border);
  }
  &--sky {
    background: linear-gradient(135deg, $color-sky-dim, $color-sky);
  }
  &--meadow {
    background: linear-gradient(135deg, $color-meadow-dim, $color-meadow);
  }
  &--sun {
    background: linear-gradient(135deg, $color-sun-dim, $color-sun);
  }
  &--peach {
    background: linear-gradient(135deg, $color-peach-dim, $color-peach);
  }
  &--lavender {
    background: linear-gradient(135deg, $color-lavender-dim, $color-lavender);
  }

  &__hint {
    padding: 8px 12px;
    font-size: 12px;
    line-height: 1.35;
    text-align: center;
    color: rgba(63, 54, 43, 0.55);
    font-style: italic;
  }

  &--real {
    display: block;
  }
}
</style>
