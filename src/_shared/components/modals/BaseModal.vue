<script setup lang="ts">
import { provide } from 'vue'
import { type IActiveModal, ModalContextKey } from '@/_shared/plugins/modals.plugin'

const props = defineProps<{ instance: IActiveModal }>()
provide(ModalContextKey, props.instance)
</script>

<template>
  <div class="modal-block" :id="instance.id" @click.self="instance.close()">
    <slot>content</slot>
  </div>
</template>

<style lang="scss">
@use 'sass:color';

// Overlay
.modal-block {
  position: fixed;
  inset: 0;
  z-index: 999;

  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding: 24px;

  overflow-y: auto;
  overscroll-behavior: contain;
  @include scrollbar(0);

  @media (min-width: 560px) {
    align-items: center;
  }

  &::before {
    content: '';
    position: fixed;
    inset: 0;
    background: rgba(63, 54, 43, 0.28);
    backdrop-filter: blur(3px);
    z-index: -1;
  }

  // Анимация (TransitionGroup name="modal-fade")
  &.modal-fade-enter-active,
  &.modal-fade-leave-active {
    transition: opacity $anim ease;
    &::before {
      transition:
        backdrop-filter $anim ease,
        background-color $anim ease;
    }
    & > .modal {
      transition:
        transform $anim $ease-soft,
        opacity $anim ease;
    }
  }
  &.modal-fade-enter-from,
  &.modal-fade-leave-to {
    opacity: 0;
    &::before {
      backdrop-filter: blur(0);
      background-color: rgba(63, 54, 43, 0);
    }
    & > .modal {
      transform: translateY(16px) scale(0.97);
      opacity: 0;
    }
  }
}

// Карточка модалки
.modal {
  position: relative;
  width: 100%;
  max-width: 460px;
  margin: auto;
  padding: 22px;

  display: flex;
  flex-direction: column;
  gap: 18px;

  @include card($radius-lg, $shadow-float);
  border: 1px solid $color-border;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  &__title {
    margin: 0;
    font-family: 'Comfortaa', sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: $color-heading;
  }

  &__subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    color: $color-muted;
    b {
      color: $color-text;
      font-weight: 700;
    }
  }

  &__close {
    flex: 0 0 auto;
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-pill;
    color: $color-muted;
    font-size: 22px;
    @include anim(background-color);
    &:hover {
      background: $color-surface-2;
      color: $color-text;
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    &--split {
      justify-content: space-between;
    }
  }

  &__footer-right {
    display: inline-flex;
    gap: 8px;
  }

  // Кнопки (ModalBtn)
  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 18px;
    min-height: 40px;

    border: 1px solid $color-border;
    border-radius: $radius-pill;
    background: $color-surface;
    color: $color-text;
    font-weight: 700;
    font-size: 14px;
    @include anim(background-color);

    &:hover:not(:disabled) {
      background: $color-surface-2;
    }
    &:disabled {
      opacity: 0.55;
    }

    &--ghost {
      background: transparent;
      border-color: transparent;
      color: $color-muted;
      &:hover:not(:disabled) {
        background: $color-surface-2;
        color: $color-text;
      }
    }
    &--primary {
      background: $color-accent;
      border-color: $color-accent;
      color: #fff;
      &:hover:not(:disabled) {
        background: color.adjust($color-accent, $lightness: -6%);
      }
    }
    &--danger {
      background: rgba($color-danger, 0.08);
      border-color: rgba($color-danger, 0.3);
      color: $color-danger;
      &:hover:not(:disabled) {
        background: rgba($color-danger, 0.16);
      }
    }
  }

  &__spin {
    animation: modal-spin 1s linear infinite;
  }
}

@keyframes modal-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
