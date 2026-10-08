<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useWakeLock } from '@vueuse/core'
import { ChevronLeft, Pencil, Heart, Lightbulb, LightbulbOff, RotateCcw } from 'lucide-vue-next'
import { useRecipe } from '@/features/recipes/model/useRecipe'
import { useCategories } from '@/features/categories/model/useCategories'
import { useIngredientChecks } from '@/features/recipes/model/useIngredientChecks'
import { useFavorites } from '@/features/favorites/model/useFavorites'
import { useAuthStore } from '@/features/auth/model/auth.store'
import { CategoryVisuals } from '@/features/categories/lib/category-visuals'
import { TimeHelper } from '@/services/helpers/number.helper'
import { useNotificationsStore } from '@/_shared/stores/notifications'
import SectionBlock from '@/features/recipes/ui/SectionBlock.vue'
import RecipeGallery from '@/features/recipes/ui/RecipeGallery.vue'
import AppScreen from '@/shared/ui/AppScreen.vue'
import AppHeader from '@/shared/ui/AppHeader.vue'
import IconButton from '@/shared/ui/IconButton.vue'
import Chip from '@/shared/ui/Chip.vue'
import Skeleton from '@/shared/ui/Skeleton.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'

const props = defineProps<{ id: string }>()
const router = useRouter()

const { recipe, isLoading, isError } = useRecipe(() => props.id)
const { categories } = useCategories()
const checks = useIngredientChecks(props.id)
const { data: fav, actions: favActions } = useFavorites()

const { isAdmin } = storeToRefs(useAuthStore())

const categoryTitle = computed(
  () => categories.value?.find((c) => c.slug === recipe.value?.category_slug)?.title ?? '',
)

// ─── Режим готовки ───
// Экран не гаснет, пока готовим (Wake Lock). vueuse сам перезахватывает
// после возврата во вкладку; при уходе со страницы — отпускаем явно.
const notifications = useNotificationsStore()
const wakeLock = useWakeLock()
async function toggleWakeLock() {
  try {
    if (wakeLock.isActive.value) await wakeLock.release()
    else await wakeLock.request('screen')
  } catch {
    notifications.error('Не получилось — браузер не разрешил держать экран включённым')
  }
}
onBeforeUnmount(() => void wakeLock.release())

// Есть ли отметки в ЭТОМ рецепте (в хранилище могут быть старые ключи).
const hasChecks = computed(() =>
  (recipe.value?.sections ?? []).some(
    (s) =>
      s.ingredients.some((i) => checks.isChecked(i.id)) ||
      s.steps.some((_, i) => checks.isChecked(`step:${s.id}:${i}`)),
  ),
)

// Быстрые переходы — когда частей несколько.
const sectionNav = computed(() => {
  const sections = recipe.value?.sections ?? []
  if (sections.length < 2) return []
  return sections.map((s, i) => ({ id: s.id, title: s.title || `Часть ${i + 1}` }))
})
function scrollToSection(id: string) {
  document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <AppScreen>
    <AppHeader>
      <template #left>
        <IconButton label="Назад" @click="router.back()">
          <ChevronLeft :size="24" />
        </IconButton>
      </template>
      <template #right>
        <IconButton
          v-if="recipe"
          :label="fav.isFavorite(recipe.id) ? 'Убрать из избранного' : 'В избранное'"
          @click="favActions.toggle(recipe.id)"
        >
          <Heart
            :size="20"
            class="recipe__fav"
            :class="{ 'recipe__fav--on': fav.isFavorite(recipe.id) }"
            :fill="fav.isFavorite(recipe.id) ? 'currentColor' : 'none'"
          />
        </IconButton>
        <IconButton
          v-if="isAdmin"
          label="Редактировать"
          @click="router.push({ name: 'recipe-edit', params: { id } })"
        >
          <Pencil :size="20" />
        </IconButton>
      </template>
    </AppHeader>

    <!-- Загрузка -->
    <div v-if="isLoading" class="recipe__loading">
      <Skeleton height="220px" radius="20px" />
      <Skeleton width="60%" height="28px" />
      <Skeleton height="200px" radius="20px" />
    </div>

    <EmptyState
      v-else-if="isError || !recipe"
      title="Рецепт не найден"
      subtitle="Возможно, он был удалён"
    />

    <template v-else>
      <RecipeGallery :recipe="recipe" />

      <h1 class="recipe__title">{{ recipe.title }}</h1>
      <div class="recipe__meta">
        <RouterLink
          v-if="categoryTitle"
          :to="{ name: 'category', params: { slug: recipe.category_slug } }"
          class="recipe__cat-link"
        >
          <Chip :tone="CategoryVisuals.tone(recipe.category_slug)">{{ categoryTitle }}</Chip>
        </RouterLink>
        <Chip tone="sky">{{ TimeHelper.duration(recipe.time_minutes) }}</Chip>
      </div>

      <!-- Режим готовки: экран не гаснет / сброс отметок -->
      <div v-if="wakeLock.isSupported.value || hasChecks" class="recipe__tools">
        <button
          v-if="wakeLock.isSupported.value"
          type="button"
          class="tool"
          :class="{ 'tool--on': wakeLock.isActive.value }"
          :aria-pressed="wakeLock.isActive.value"
          @click="toggleWakeLock"
        >
          <Lightbulb v-if="wakeLock.isActive.value" :size="16" />
          <LightbulbOff v-else :size="16" />
          {{ wakeLock.isActive.value ? 'Экран не гаснет' : 'Не гасить экран' }}
        </button>
        <button v-if="hasChecks" type="button" class="tool" @click="checks.reset()">
          <RotateCcw :size="16" /> Сбросить отметки
        </button>
      </div>

      <!-- Быстрые переходы по частям рецепта -->
      <nav v-if="sectionNav.length" class="recipe__nav" aria-label="Части рецепта">
        <button
          v-for="s in sectionNav"
          :key="s.id"
          type="button"
          class="recipe__nav-item"
          @click="scrollToSection(s.id)"
        >
          {{ s.title }}
        </button>
      </nav>

      <div class="recipe__sections">
        <SectionBlock
          v-for="section in recipe.sections"
          :key="section.id"
          :section="section"
          :is-checked="checks.isChecked"
          :on-set="checks.set"
        />
      </div>
    </template>
  </AppScreen>
</template>

<style scoped lang="scss">
.recipe {
  &__loading {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 8px;
  }

  &__title {
    margin: 18px 0 10px;
    font-size: 30px;
  }

  &__fav {
    @include anim(color);
    &--on {
      color: $color-favorite;
    }
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 14px;
  }
  &__cat-link {
    display: inline-flex;
    border-radius: $radius-pill;
    @include anim(transform);
    &:active {
      transform: scale(0.96);
    }
  }

  &__tools {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }

  &__nav {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    margin: 0 -16px 16px;
    padding: 2px 16px;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
  &__nav-item {
    flex: 0 0 auto;
    padding: 8px 14px;
    min-height: 36px;
    border-radius: $radius-pill;
    background: $color-surface;
    box-shadow: $shadow-soft;
    font-weight: 700;
    font-size: 14px;
    @include anim(transform);
    &:active {
      transform: scale(0.96);
    }
  }

  &__sections {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

// Кнопки режима готовки (пилюли).
.tool {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 7px 14px;
  border-radius: $radius-pill;
  border: 1.5px solid $color-border;
  background: $color-surface;
  color: $color-muted;
  font-weight: 700;
  font-size: 13px;
  @include anim(background-color);
  transition-property: background-color, color, border-color;

  &:hover {
    color: $color-text;
  }
  &--on {
    background: $color-sun-dim;
    border-color: $color-sun;
    color: $color-heading;
  }
}
</style>
