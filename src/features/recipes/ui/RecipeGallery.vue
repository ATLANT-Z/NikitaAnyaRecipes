<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RecipeDto } from '@/api/recipes/resources/recipe.resource'
import { CategoryVisuals } from '@/features/categories/lib/category-visuals'
import ImagePlaceholder from '@/shared/ui/ImagePlaceholder.vue'

// Галерея фото блюда: свайп-карусель (нативный scroll-snap) + миниатюры
// для тапа — жест не единственный способ листать.
const props = defineProps<{ recipe: RecipeDto }>()

// Старые записи без images — показываем одиночную обложку.
const images = computed(() => {
  if (props.recipe.images?.length) return props.recipe.images
  return props.recipe.cover_url ? [{ id: 'cover', url: props.recipe.cover_url }] : []
})

const track = ref<HTMLElement | null>(null)
const active = ref(0)

function onScroll() {
  const el = track.value
  if (!el) return
  active.value = Math.round(el.scrollLeft / el.clientWidth)
}

function goTo(i: number) {
  const el = track.value
  if (!el) return
  el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
}
</script>

<template>
  <div class="gallery">
    <div v-if="!images.length" class="gallery__frame">
      <ImagePlaceholder
        :tone="CategoryVisuals.tone(recipe.category_slug)"
        :hint="`Аппетитное фото: ${recipe.title.toLowerCase()}`"
        :alt="recipe.title"
      />
    </div>

    <template v-else>
      <div ref="track" class="gallery__frame gallery__track" @scroll.passive="onScroll">
        <img
          v-for="(img, i) in images"
          :key="img.id"
          class="gallery__slide"
          :src="img.url"
          :alt="images.length > 1 ? `${recipe.title} — фото ${i + 1}` : recipe.title"
          :loading="i === 0 ? 'eager' : 'lazy'"
        />
      </div>

      <div v-if="images.length > 1" class="gallery__thumbs">
        <button
          v-for="(img, i) in images"
          :key="img.id"
          type="button"
          class="gallery__thumb"
          :class="{ 'gallery__thumb--active': i === active }"
          :aria-label="`Показать фото ${i + 1}`"
          :aria-current="i === active"
          @click="goTo(i)"
        >
          <img :src="img.url" alt="" loading="lazy" />
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.gallery {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__frame {
    aspect-ratio: 16 / 11;
    border-radius: $radius-lg;
    overflow: hidden;
    box-shadow: $shadow-card;
  }

  &__track {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    overscroll-behavior-x: contain;
    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__slide {
    flex: 0 0 100%;
    width: 100%;
    height: 100%;
    object-fit: cover;
    scroll-snap-align: center;
  }

  &__thumbs {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 2px;
    @include scrollbar(4px);
  }

  &__thumb {
    flex: 0 0 auto;
    width: 64px;
    height: 48px;
    border-radius: $radius-sm;
    overflow: hidden;
    opacity: 0.55;
    outline: 2px solid transparent;
    outline-offset: 1px;
    @include anim(opacity);
    transition-property: opacity, outline-color;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &--active {
      opacity: 1;
      outline-color: $color-accent;
    }
  }
}
</style>
