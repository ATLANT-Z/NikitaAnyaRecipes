<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Search, LogIn, LogOut, LayoutGrid } from 'lucide-vue-next'
import { useCategories } from '@/features/categories/model/useCategories'
import { useCategoryCovers } from '@/features/categories/model/useCategoryCovers'
import { useAuthStore } from '@/features/auth/model/auth.store'
import { useNotificationsStore } from '@/_shared/stores/notifications'
import CategoryTile from '@/features/categories/ui/CategoryTile.vue'
import SearchPanel from '@/features/recipes/ui/SearchPanel.vue'
import AppScreen from '@/shared/ui/AppScreen.vue'
import AppHeader from '@/shared/ui/AppHeader.vue'
import IconButton from '@/shared/ui/IconButton.vue'
import Skeleton from '@/shared/ui/Skeleton.vue'

const router = useRouter()
const { categories, isLoading } = useCategories()
const { coversBySlug } = useCategoryCovers()
const auth = useAuthStore()
const { isAuthed, isAdmin } = storeToRefs(auth)
const notifications = useNotificationsStore()
const isSearchOpen = ref(false)

async function onLogout() {
  await auth.logout()
  notifications.success('Вы вышли')
}
</script>

<template>
  <AppScreen>
    <AppHeader>
      <template #right>
        <IconButton label="Поиск" @click="isSearchOpen = true">
          <Search :size="22" />
        </IconButton>
        <IconButton
          v-if="isAdmin"
          label="Категории"
          @click="router.push({ name: 'categories' })"
        >
          <LayoutGrid :size="22" />
        </IconButton>
        <IconButton v-if="isAuthed" label="Выйти" @click="onLogout">
          <LogOut :size="22" />
        </IconButton>
        <IconButton v-else label="Войти" @click="router.push({ name: 'login' })">
          <LogIn :size="22" />
        </IconButton>
      </template>
    </AppHeader>

    <h1 class="home__greeting">Что готовим?</h1>

    <div v-if="isLoading" class="home__grid">
      <Skeleton v-for="n in 8" :key="n" height="auto" radius="20px" class="home__skeleton" />
    </div>
    <div v-else class="home__grid">
      <CategoryTile
        v-for="cat in categories"
        :key="cat.id"
        :category="cat"
        :covers="coversBySlug.get(cat.slug)"
      />
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

    // Мягкое каскадное появление плиток (гасится prefers-reduced-motion).
    > * {
      animation: tile-in $anim-slow $ease-soft both;
    }
    @for $i from 1 through 8 {
      > *:nth-child(#{$i}) {
        animation-delay: #{($i - 1) * 0.05}s;
      }
    }
  }

  &__skeleton {
    aspect-ratio: 4 / 3;
    height: auto;
  }
}

@keyframes tile-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
