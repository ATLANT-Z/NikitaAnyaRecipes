<script setup lang="ts">
import { Field } from 'vee-validate'

// Единственная обёртка инпутов форм. Стили инпутов — глобально тут (.smart-field).
defineProps<{ name: string; label?: string }>()
</script>

<template>
  <div class="smart-field">
    <Field :name="name" v-slot="vee">
      <span v-if="label" class="smart-field__label">{{ label }}</span>
      <slot v-bind="vee" />
      <span v-if="vee.errors.length" class="ui-errors">
        <span v-for="err in vee.errors" :key="err" class="ui-error">{{ err }}</span>
      </span>
    </Field>
  </div>
</template>

<style lang="scss">
@use 'sass:color';

.smart-field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__label {
    font-size: 12px;
    font-weight: 600;
    color: $color-muted;
  }

  input:not([type='checkbox']):not([type='radio']):not([type='file']),
  select,
  textarea {
    width: 100%;
    padding: 11px 14px;
    border: 1.5px solid $color-border;
    border-radius: $radius;
    background: $color-surface;
    color: $color-text;
    font-size: 15px;
    outline: none;
    @include anim(border-color);
    transition-property: border-color, box-shadow;

    &:focus {
      border-color: $color-accent;
      box-shadow: 0 0 0 3px $color-accent-dim;
    }
    &:disabled {
      background: $color-surface-2;
      color: $color-muted;
      cursor: not-allowed;
    }
    &::placeholder {
      color: $color-muted;
    }
  }

  textarea {
    resize: vertical;
    min-height: 64px;
  }

  .ui-errors {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .ui-error {
    font-size: 12px;
    line-height: 1.3;
    color: $color-danger;
  }

  &:has(.ui-errors) {
    input:not([type='checkbox']):not([type='radio']):not([type='file']),
    select,
    textarea {
      border-color: $color-danger;
      &:focus {
        box-shadow: 0 0 0 3px rgba($color-danger, 0.15);
      }
    }
  }
}
</style>
