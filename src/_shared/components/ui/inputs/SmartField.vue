<script setup lang="ts">
import { Field } from 'vee-validate'

// Единственная обёртка инпутов форм. Стили полей (.smart-field) — глобальные,
// в assets/scss/common/_forms.scss (грузятся всегда, независимо от импорта
// этого компонента).
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
