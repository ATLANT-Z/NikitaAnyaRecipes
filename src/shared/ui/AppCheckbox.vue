<script setup lang="ts">
import { CheckboxRoot, CheckboxIndicator } from 'reka-ui'
import { Check } from 'lucide-vue-next'

// Доступный чекбокс (reka-ui). Используется в чек-листе ингредиентов.
// block — на всю ширину строки с крупной зоной тапа (удобно на кухне).
const model = defineModel<boolean>({ default: false })
defineProps<{ label?: string; block?: boolean }>()
</script>

<template>
  <label class="check" :class="{ 'check--block': block }">
    <CheckboxRoot v-model="model" class="check__box">
      <CheckboxIndicator class="check__indicator">
        <Check :size="14" :stroke-width="3" />
      </CheckboxIndicator>
    </CheckboxRoot>
    <span
      v-if="label || $slots.default"
      class="check__label"
      :class="{ 'check__label--done': model }"
    >
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped lang="scss">
.check {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  &--block {
    display: flex;
    width: 100%;
    min-height: 44px;
    .check__label {
      flex: 1;
      min-width: 0;
    }
  }

  &__box {
    flex: 0 0 auto;
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 2px solid $color-border;
    border-radius: $radius-sm;
    background: $color-surface;
    color: #fff;
    @include anim(background-color);
    transition-property: background-color, border-color;

    &[data-state='checked'] {
      background: $color-success;
      border-color: $color-success;
    }
  }

  &__indicator {
    display: inline-flex;
  }

  &__label {
    font-size: 15px;
    @include anim(color);
    &--done {
      color: $color-muted;
      text-decoration: line-through;
    }
  }
}
</style>
