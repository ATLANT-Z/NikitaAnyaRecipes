<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { CategoryDto } from '@/api/categories/resources/category.resource'
import { CategoryVisuals } from '@/features/categories/lib/category-visuals'
import ImagePlaceholder from '@/shared/ui/ImagePlaceholder.vue'

const props = withDefaults(defineProps<{ category: CategoryDto; covers?: string[] }>(), {
  covers: () => [],
})

// Своё фото категории важнее; нет — мозаика до 4 обложек блюд
// (раскладка зависит от их числа, см. --1…--4 в стилях).
const shown = computed(() =>
  props.category.image_url ? [props.category.image_url] : props.covers.slice(0, 4),
)
</script>

<template>
  <RouterLink :to="{ name: 'category', params: { slug: category.slug } }" class="cat-tile">
    <div class="cat-tile__media">
      <!-- Мозаика из обложек блюд категории; нет фото — мягкая заглушка. -->
      <div v-if="shown.length" class="cat-tile__mosaic" :class="`cat-tile__mosaic--${shown.length}`">
        <img
          v-for="(url, i) in shown"
          :key="i"
          class="cat-tile__cell"
          :src="url"
          :alt="i === 0 ? category.title : ''"
          loading="lazy"
        />
      </div>
      <ImagePlaceholder
        v-else
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

  &__mosaic {
    position: absolute;
    inset: 0;
    display: grid;
    gap: 2px;
    background: $color-surface; // светлые «швы» между обложками

    // 1 фото — на всю плитку.
    &--1 {
      grid-template-columns: 1fr;
    }
    // 2 фото — два столбца в высоту.
    &--2 {
      grid-template-columns: 1fr 1fr;
    }
    // 3 фото — крупное слева, два стопкой справа.
    &--3 {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      .cat-tile__cell:first-child {
        grid-row: 1 / 3;
      }
    }
    // 4 фото — ровная сетка 2×2.
    &--4 {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
    }
  }

  &__cell {
    width: 100%;
    height: 100%;
    object-fit: cover;
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
