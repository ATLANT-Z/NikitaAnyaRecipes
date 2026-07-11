<script setup lang="ts">
import { ref } from 'vue'
import { Search } from 'lucide-vue-next'
import { useCategories } from '@/features/categories/model/useCategories'
import CategoryTile from '@/features/categories/ui/CategoryTile.vue'
import SearchPanel from '@/features/recipes/ui/SearchPanel.vue'
import AppScreen from '@/shared/ui/AppScreen.vue'
import AppHeader from '@/shared/ui/AppHeader.vue'
import IconButton from '@/shared/ui/IconButton.vue'
import Skeleton from '@/shared/ui/Skeleton.vue'

const { categories, isLoading } = useCategories()
const isSearchOpen = ref(false)
</script>

<template>
  <AppScreen>
    <AppHeader>
      <template #right>
        <IconButton label="Поиск" @click="isSearchOpen = true">
          <Search :size="22" />
        </IconButton>
      </template>
    </AppHeader>

    <h1 class="home__greeting">Что готовим?</h1>

    <div v-if="isLoading" class="home__grid">
      <Skeleton v-for="n in 8" :key="n" height="auto" radius="20px" class="home__skeleton" />
    </div>
    <div v-else class="home__grid">
      <CategoryTile v-for="cat in categories" :key="cat.id" :category="cat" />
    </div>

    <SearchPanel v-model:open="isSearchOpen" />
  </AppScreen>
</template>

<style scoped lang="scss">
.home {
  &__greeting {
    margin: 8px 0 20px;
    font-size: 28px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  &__skeleton {
    aspect-ratio: 4 / 3;
    height: auto;
  }
}
</style>
