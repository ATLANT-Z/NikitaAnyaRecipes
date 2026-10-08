<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft, ChevronUp, ChevronDown, Plus, Pencil, Trash2 } from 'lucide-vue-next'
import type { CategoryDto } from '@/api/categories/resources/category.resource'
import { useCategories } from '@/features/categories/model/useCategories'
import { useCategorySave } from '@/features/categories/model/useCategorySave'
import { useCategoryCovers } from '@/features/categories/model/useCategoryCovers'
import { CategoryVisuals } from '@/features/categories/lib/category-visuals'
import { useNotificationsStore } from '@/_shared/stores/notifications'
import { useModals } from '@/services/modal.service'
import AppScreen from '@/shared/ui/AppScreen.vue'
import AppHeader from '@/shared/ui/AppHeader.vue'
import IconButton from '@/shared/ui/IconButton.vue'
import AppButton from '@/shared/ui/AppButton.vue'
import ImagePlaceholder from '@/shared/ui/ImagePlaceholder.vue'
import Skeleton from '@/shared/ui/Skeleton.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'

// Управление категориями (только админ): создать, переименовать, фото,
// порядок на главной, удалить пустую.
const router = useRouter()
const modals = useModals()
const notifications = useNotificationsStore()
const { categories, isLoading } = useCategories()
const { coversBySlug } = useCategoryCovers()
const { actions, isSaving, isRemoving } = useCategorySave()

const list = computed(() => categories.value ?? [])
const isBusy = computed(() => isSaving.value || isRemoving.value)

// Превью строки: своё фото → первое фото блюд → цвет-заглушка.
function thumbOf(c: CategoryDto): string | null {
  return c.image_url ?? coversBySlug.value.get(c.slug)?.[0] ?? null
}

async function onAdd() {
  const nextSortOrder = (list.value.at(-1)?.sort_order ?? 0) + 1
  const saved = await modals.show('category-edit', { props: { nextSortOrder } }).wait
  if (saved) notifications.success(`Категория «${saved.title}» создана`)
}

async function onEdit(category: CategoryDto) {
  const saved = await modals.show('category-edit', { props: { category } }).wait
  if (saved) notifications.success('Сохранено')
}

// Перестановка: меняем местами соседей и сохраняем только тех, чей
// sort_order реально изменился (заодно выравниваем 1..N).
async function onMove(from: number, to: number) {
  if (to < 0 || to >= list.value.length || isBusy.value) return
  const ordered = [...list.value]
  const [moved] = ordered.splice(from, 1)
  ordered.splice(to, 0, moved)
  const before = new Map(list.value.map((c) => [c.id, c.sort_order]))
  const changed = ordered
    .map((c, i) => ({ ...c, sort_order: i + 1 }))
    .filter((c) => before.get(c.id) !== c.sort_order)
  try {
    for (const c of changed) await actions.save(c)
  } catch {
    // ошибку показал тост; список перечитается из кэша как есть
  }
}

async function onDelete(category: CategoryDto) {
  const ok = await modals.show('confirm', {
    props: {
      title: `Удалить «${category.title}»?`,
      message: 'Удалить можно только пустую категорию — без рецептов.',
      confirmText: 'Удалить',
      danger: true,
    },
  }).wait
  if (!ok) return
  try {
    await actions.remove(category.slug)
    notifications.success('Категория удалена')
  } catch {
    // сообщение (напр. «в категории есть рецепты») уже показал тост
  }
}
</script>

<template>
  <AppScreen>
    <AppHeader title="Категории">
      <template #left>
        <IconButton label="Назад" @click="router.back()">
          <ChevronLeft :size="24" />
        </IconButton>
      </template>
      <template #right>
        <IconButton label="Новая категория" @click="onAdd">
          <Plus :size="22" />
        </IconButton>
      </template>
    </AppHeader>

    <div v-if="isLoading" class="cats__list">
      <Skeleton v-for="n in 5" :key="n" height="76px" radius="20px" />
    </div>

    <EmptyState v-else-if="!list.length" title="Категорий пока нет" subtitle="Создайте первую" />

    <TransitionGroup v-else tag="ul" name="cats-move" class="cats__list">
      <li v-for="(c, i) in list" :key="c.id" class="cats__row">
        <div class="cats__thumb">
          <ImagePlaceholder :src="thumbOf(c)" :tone="CategoryVisuals.tone(c.slug)" :alt="c.title" />
        </div>

        <div class="cats__info">
          <span class="cats__title">{{ c.title }}</span>
          <span class="cats__sub">{{ c.image_url ? 'своё фото' : 'фото из блюд' }}</span>
        </div>

        <div class="cats__order">
          <button
            type="button"
            class="cats__order-btn"
            aria-label="Выше"
            :disabled="i === 0 || isBusy"
            @click="onMove(i, i - 1)"
          >
            <ChevronUp :size="18" />
          </button>
          <button
            type="button"
            class="cats__order-btn"
            aria-label="Ниже"
            :disabled="i === list.length - 1 || isBusy"
            @click="onMove(i, i + 1)"
          >
            <ChevronDown :size="18" />
          </button>
        </div>

        <IconButton label="Редактировать" variant="ghost" @click="onEdit(c)">
          <Pencil :size="18" />
        </IconButton>
        <IconButton label="Удалить" variant="ghost" @click="onDelete(c)">
          <Trash2 :size="18" />
        </IconButton>
      </li>
    </TransitionGroup>

    <AppButton variant="soft" block class="cats__add" @click="onAdd">
      <Plus :size="18" /> Новая категория
    </AppButton>
  </AppScreen>
</template>

<style scoped lang="scss">
.cats {
  &__list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 8px;
  }

  &__row {
    @include card($radius-lg);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 6px 10px 10px;
  }

  &__thumb {
    flex: 0 0 auto;
    width: 56px;
    height: 56px;
    border-radius: $radius;
    overflow: hidden;
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  &__title {
    font-weight: 700;
    @include clamp-lines(1);
  }
  &__sub {
    font-size: 12px;
    color: $color-muted;
  }

  &__order {
    display: flex;
    flex-direction: column;
    &-btn {
      width: 40px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: $radius-sm;
      color: $color-muted;
      @include anim(color);
      &:hover:not(:disabled) {
        color: $color-text;
        background: $color-surface-2;
      }
      &:disabled {
        opacity: 0.3;
      }
    }
  }

  &__add {
    margin-top: 16px;
  }
}

.cats-move-move {
  transition: transform $anim $ease-soft;
}
</style>
