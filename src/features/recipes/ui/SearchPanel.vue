<script setup lang="ts">
import { watch, nextTick, useTemplateRef } from 'vue'
import { Search, X } from 'lucide-vue-next'
import { useRecipeSearch } from '@/features/recipes/model/useRecipeSearch'
import RecipeCard from '@/features/recipes/ui/RecipeCard.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'

// Полноэкранная панель поиска. Управляется v-model:open из шапки экрана.
const open = defineModel<boolean>('open', { default: false })
const { term, results, isLoading } = useRecipeSearch()
const input = useTemplateRef<HTMLInputElement>('input')

// При открытии — фокус на поле; при закрытии — сброс запроса.
watch(open, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    input.value?.focus()
  } else {
    term.value = ''
  }
})
</script>

<template>
  <Transition name="search-fade">
    <div v-if="open" class="search">
      <div class="search__bar">
        <Search :size="20" class="search__icon" />
        <input
          ref="input"
          v-model="term"
          class="search__input"
          type="search"
          placeholder="Найти рецепт…"
          enterkeyhint="search"
        />
        <button
          type="button"
          class="search__close"
          aria-label="Закрыть поиск"
          @click="open = false"
        >
          <X :size="20" />
        </button>
      </div>

      <div class="search__body">
        <p v-if="isLoading" class="search__status">Ищем…</p>
        <div v-else-if="results && results.length" class="search__grid">
          <RecipeCard v-for="r in results" :key="r.id" :recipe="r" @click="open = false" />
        </div>
        <EmptyState
          v-else-if="term.trim()"
          title="Ничего не нашлось"
          subtitle="Попробуй другое название"
        />
        <EmptyState v-else title="Что приготовим?" subtitle="Начни вводить название рецепта" />
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.search {
  position: fixed;
  inset: 0;
  z-index: 40;
  @include watercolor-sky;
  @include safe-top(12px);
  padding: 12px 16px 24px;
  overflow-y: auto;
  @include scrollbar;

  &__bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    @include card($radius-pill);
    position: sticky;
    top: 0;
  }
  &__icon {
    color: $color-muted;
    flex: 0 0 auto;
  }
  &__input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font-size: 16px;
    &::-webkit-search-cancel-button {
      display: none;
    }
  }
  &__close {
    color: $color-muted;
    display: inline-flex;
  }

  &__body {
    margin-top: 16px;
  }
  &__status {
    text-align: center;
    color: $color-muted;
    padding: 24px;
  }
  &__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }
}

.search-fade-enter-active,
.search-fade-leave-active {
  transition: opacity $anim ease;
}
.search-fade-enter-from,
.search-fade-leave-to {
  opacity: 0;
}
</style>
