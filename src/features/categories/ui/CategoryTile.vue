<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { CategoryDto } from '@/api/categories/resources/category.resource'
import { CategoryVisuals } from '@/features/categories/lib/category-visuals'
import ImagePlaceholder from '@/shared/ui/ImagePlaceholder.vue'

defineProps<{ category: CategoryDto }>()
</script>

<template>
  <RouterLink :to="{ name: 'category', params: { slug: category.slug } }" class="cat-tile">
    <div class="cat-tile__media">
      <ImagePlaceholder
        :tone="CategoryVisuals.tone(category.slug)"
        :hint="`Фото блюда: ${category.title.toLowerCase()}`"
        :alt="category.title"
      />
      <span class="cat-tile__scrim" />
    </div>
    <span class="cat-tile__title">{{ category.title }}</span>
  </RouterLink>
</template>

<style scoped lang="scss">
.cat-tile {
  position: relative;
  display: block;
  aspect-ratio: 4 / 3;
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: $shadow-card;
  @include anim(transform);
  transition-property: transform, box-shadow;

  &:active {
    transform: scale(0.97);
  }
  &:hover {
    box-shadow: $shadow-float;
  }

  &__media {
    position: absolute;
    inset: 0;
  }

  &__scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 40%, rgba(47, 40, 32, 0.55));
  }

  &__title {
    position: absolute;
    left: 16px;
    bottom: 14px;
    z-index: 1;
    color: #fff;
    font-family: 'Comfortaa', sans-serif;
    font-weight: 700;
    font-size: 20px;
    text-shadow: 0 1px 8px rgba(0, 0, 0, 0.25);
  }
}
</style>
