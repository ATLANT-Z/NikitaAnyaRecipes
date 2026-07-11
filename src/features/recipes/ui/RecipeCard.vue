<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Heart } from 'lucide-vue-next'
import type { RecipeCardDto } from '@/api/recipes/resources/recipe.resource'
import { CategoryVisuals } from '@/features/categories/lib/category-visuals'
import { useFavorites } from '@/features/favorites/model/useFavorites'
import ImagePlaceholder from '@/shared/ui/ImagePlaceholder.vue'

defineProps<{ recipe: RecipeCardDto }>()

const { data, actions } = useFavorites()
</script>

<template>
  <div class="recipe-card">
    <RouterLink :to="{ name: 'recipe', params: { id: recipe.id } }" class="recipe-card__link">
      <div class="recipe-card__media">
        <ImagePlaceholder
          :src="recipe.cover_url"
          :tone="CategoryVisuals.tone(recipe.category_slug)"
          :hint="`Фото: ${recipe.title.toLowerCase()}`"
          :alt="recipe.title"
        />
      </div>
      <span class="recipe-card__title">{{ recipe.title }}</span>
    </RouterLink>

    <button
      type="button"
      class="recipe-card__fav"
      :class="{ 'recipe-card__fav--on': data.isFavorite(recipe.id) }"
      :aria-label="data.isFavorite(recipe.id) ? 'Убрать из избранного' : 'В избранное'"
      @click="actions.toggle(recipe.id)"
    >
      <Heart :size="18" :fill="data.isFavorite(recipe.id) ? 'currentColor' : 'none'" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.recipe-card {
  position: relative;
  @include card($radius-lg);
  overflow: hidden;

  &__link {
    display: block;
  }

  &__media {
    aspect-ratio: 1 / 1;
  }

  &__title {
    display: block;
    padding: 12px 14px;
    font-weight: 700;
    font-size: 16px;
    @include clamp-lines(1);
  }

  &__fav {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-pill;
    background: rgba(255, 253, 248, 0.85);
    backdrop-filter: blur(4px);
    color: $color-muted;
    box-shadow: $shadow-soft;
    @include anim(transform);
    transition-property: transform, color, background-color;

    &:active {
      transform: scale(0.85);
    }
    &--on {
      color: $color-favorite;
    }
  }
}
</style>
