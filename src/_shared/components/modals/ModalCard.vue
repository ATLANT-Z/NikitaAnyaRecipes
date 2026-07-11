<script setup lang="ts">
// Каркас модалки: шапка (title/subtitle/×) + body + footer.
// Стили — глобальные .modal* из BaseModal.
interface Props {
  title: string
  subtitle?: string
  form?: boolean
  footerSplit?: boolean
}
defineProps<Props>()
const emit = defineEmits<{ close: []; submit: [] }>()
</script>

<template>
  <component :is="form ? 'form' : 'div'" class="modal" @submit.prevent="emit('submit')">
    <header class="modal__header">
      <div>
        <p class="modal__title">{{ title }}</p>
        <p v-if="subtitle || $slots.subtitle" class="modal__subtitle">
          <slot name="subtitle">{{ subtitle }}</slot>
        </p>
      </div>
      <button type="button" class="modal__close" aria-label="Закрыть" @click="emit('close')">
        ×
      </button>
    </header>

    <div class="modal__body">
      <slot />
    </div>

    <footer
      v-if="$slots.footer"
      class="modal__footer"
      :class="{ 'modal__footer--split': footerSplit }"
    >
      <slot name="footer" />
    </footer>
  </component>
</template>
