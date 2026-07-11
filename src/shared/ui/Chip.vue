<script setup lang="ts">
// Пилюля-бейдж: категория, время, метка. Цвет — из палитры через `tone`.
interface Props {
  tone?: 'neutral' | 'sky' | 'meadow' | 'sun' | 'peach' | 'lavender'
}
withDefaults(defineProps<Props>(), { tone: 'neutral' })
</script>

<template>
  <span class="chip" :class="`chip--${tone}`">
    <slot />
  </span>
</template>

<style scoped lang="scss">
.chip {
  @include pill;
  font-weight: 600;
  color: $color-text;
  background: $color-surface-2;

  &--sky {
    background: $color-sky-dim;
    color: color-mix(in srgb, $color-sky 70%, $color-text);
  }
  &--meadow {
    background: $color-meadow-dim;
    color: color-mix(in srgb, $color-meadow 60%, $color-text);
  }
  &--sun {
    background: $color-sun-dim;
    color: color-mix(in srgb, $color-sun 45%, $color-text);
  }
  &--peach {
    background: $color-peach-dim;
    color: color-mix(in srgb, $color-peach 55%, $color-text);
  }
  &--lavender {
    background: $color-lavender-dim;
    color: color-mix(in srgb, $color-lavender 60%, $color-text);
  }
}
</style>
