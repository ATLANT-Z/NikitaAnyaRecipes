<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ChevronLeft, Search, Plus } from 'lucide-vue-next'
import { useCategories } from '@/features/categories/model/useCategories'
import { useRecipeList } from '@/features/recipes/model/useRecipeList'
import { useEditModeStore } from '@/features/admin/model/edit-mode.store'
import RecipeCard from '@/features/recipes/ui/RecipeCard.vue'
import SearchPanel from '@/features/recipes/ui/SearchPanel.vue'
import AppScreen from '@/shared/ui/AppScreen.vue'
import AppHeader from '@/shared/ui/AppHeader.vue'
import IconButton from '@/shared/ui/IconButton.vue'
import Skeleton from '@/shared/ui/Skeleton.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'

const props = defineProps<{ slug: string }>()
const router = useRouter()

const { categories } = useCategories()
const title = computed(
  () => categories.value?.find((c) => c.slug === props.slug)?.title ?? 'Рецепты',
)

const { recipes, isLoading } = useRecipeList(() => props.slug)

const editMode = useEditModeStore()
const { isAdmin } = storeToRefs(editMode)
const isSearchOpen = ref(false)
</script>

<template>
  <AppScreen>
    <AppHeader :title="title">
      <template #left>
        <IconButton label="Назад" @click="router.back()">
          <ChevronLeft :size="24" />
        </IconButton>
      </template>
      <template #right>
        <IconButton label="Поиск" @click="isSearchOpen = true">
          <Search :size="22" />
        </IconButton>
        <IconButton
          v-if="isAdmin"
          label="Добавить рецепт"
          @click="router.push({ name: 'recipe-new', query: { category: slug } })"
        >
          <Plus :size="22" />
        </IconButton>
      </template>
    </AppHeader>

    <div v-if="isLoading" class="cat__grid">
      <Skeleton v-for="n in 4" :key="n" height="180px" radius="20px" />
    </div>

    <div v-else-if="recipes && recipes.length" class="cat__grid">
      <RecipeCard v-for="r in recipes" :key="r.id" :recipe="r" />
    </div>

    <EmptyState v-else title="Пока пусто" subtitle="В этой категории ещё нет рецептов" />

    <SearchPanel v-model:open="isSearchOpen" />
  </AppScreen>
</template>

<style scoped lang="scss">
.cat {
  &__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-top: 8px;
  }
}
</style>
