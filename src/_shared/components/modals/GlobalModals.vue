<script setup lang="ts">
import BaseModal from '@/_shared/components/modals/BaseModal.vue'
import type { UntypedModalService } from '@/_shared/plugins/modals.plugin'

defineProps<{ service: UntypedModalService }>()
</script>

<template>
  <TransitionGroup name="modal-fade">
    <BaseModal v-for="modal in service.stack.value" :key="modal.uid" :instance="modal">
      <component :is="modal.component" v-bind="modal.props" />
    </BaseModal>
  </TransitionGroup>
</template>
