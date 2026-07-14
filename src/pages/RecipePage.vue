<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ChevronLeft, Pencil, Heart } from 'lucide-vue-next'
import { useRecipe } from '@/features/recipes/model/useRecipe'
import { useCategories } from '@/features/categories/model/useCategories'
import { useIngredientChecks } from '@/features/recipes/model/useIngredientChecks'
import { useFavorites } from '@/features/favorites/model/useFavorites'
import { useAuthStore } from '@/features/auth/model/auth.store'
import { CategoryVisuals } from '@/features/categories/lib/category-visuals'
import { TimeHelper } from '@/services/helpers/number.helper'
import SectionBlock from '@/features/recipes/ui/SectionBlock.vue'
import AppScreen from '@/shared/ui/AppScreen.vue'
import AppHeader from '@/shared/ui/AppHeader.vue'
import IconButton from '@/shared/ui/IconButton.vue'
import ImagePlaceholder from '@/shared/ui/ImagePlaceholder.vue'
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
        <IconButton v-if="recipe" label="В избранное" @click="favActions.toggle(recipe.id)">
          <Heart
            :size="20"
            :fill="fav.isFavorite(recipe.id) ? '#f0a988' : 'none'"
            :color="fav.isFavorite(recipe.id) ? '#f0a988' : 'currentColor'"
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
      <div class="recipe__cover">
        <ImagePlaceholder
          :src="recipe.cover_url"
          :tone="CategoryVisuals.tone(recipe.category_slug)"
          :hint="`Аппетитное фото: ${recipe.title.toLowerCase()}`"
          :alt="recipe.title"
        />
      </div>

      <h1 class="recipe__title">{{ recipe.title }}</h1>
      <div class="recipe__meta">
        <Chip v-if="categoryTitle" :tone="CategoryVisuals.tone(recipe.category_slug)">
          {{ categoryTitle }}
        </Chip>
        <Chip tone="sky">{{ TimeHelper.duration(recipe.time_minutes) }}</Chip>
      </div>

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

  &__cover {
    aspect-ratio: 16 / 11;
    border-radius: $radius-lg;
    overflow: hidden;
    box-shadow: $shadow-card;
  }

  &__title {
    margin: 18px 0 10px;
    font-size: 30px;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
  }

  &__sections {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}
</style>
