<script setup lang="ts">
import { computed, ref } from 'vue'
import { v4 as uuid } from 'uuid'
import { ImagePlus, Loader2 } from 'lucide-vue-next'
import type { CategoryDto } from '@/api/categories/resources/category.resource'
import { categoriesRepository } from '@/repository/categories.repository'
import { useCategorySave } from '@/features/categories/model/useCategorySave'
import { useCategories } from '@/features/categories/model/useCategories'
import { CategoryVisuals } from '@/features/categories/lib/category-visuals'
import { SlugHelper } from '@/services/helpers/slug.helper'
import { useHandleError } from '@/_shared/composables/useHandleError'
import { useModal } from '@/services/modal.service'
import ModalCard from '@/_shared/components/modals/ModalCard.vue'
import ModalBtn from '@/_shared/components/modals/ModalBtn.vue'
import ImagePlaceholder from '@/shared/ui/ImagePlaceholder.vue'

// Создание / правка категории. Результат — сохранённая категория или null.
// Форма и сабмит живут здесь (владелец формы), наружу — только итог.
interface Props {
  category?: CategoryDto // нет — создаём новую
  nextSortOrder?: number
}
const props = withDefaults(defineProps<Props>(), { nextSortOrder: 999 })

const { resolve, close } = useModal('category-edit')
const { actions, isSaving } = useCategorySave()
const { handleError } = useHandleError()

const isNew = !props.category
const draft = ref<CategoryDto>(
  props.category
    ? { ...props.category }
    : { id: uuid(), slug: '', title: '', sort_order: props.nextSortOrder, image_url: null },
)

// slug существующей неизменен; у новой — выводим из названия и, если адрес
// занят, добавляем номер (превью показывает итоговый адрес; сервер перепроверит).
const { categories } = useCategories()
const slug = computed(() =>
  isNew
    ? SlugHelper.unique(
        SlugHelper.fromTitle(draft.value.title),
        (categories.value ?? []).map((c) => c.slug),
      )
    : draft.value.slug,
)

const submitted = ref(false)
const titleError = computed(() =>
  submitted.value && !draft.value.title.trim() ? 'Впишите название категории' : '',
)

// ─── Фото ───
const fileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)

async function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  isUploading.value = true
  try {
    draft.value.image_url = await categoriesRepository.uploadImage(draft.value.id, file)
  } catch (err) {
    handleError(err)
  } finally {
    isUploading.value = false
  }
}

async function onSubmit() {
  submitted.value = true
  if (titleError.value || isUploading.value) return
  try {
    const saved = await actions.save({
      ...draft.value,
      title: draft.value.title.trim(),
      slug: slug.value,
    })
    resolve(saved)
  } catch {
    // ошибку уже показал useCategorySave (тост); модалку не закрываем
  }
}
</script>

<template>
  <ModalCard :title="isNew ? 'Новая категория' : 'Категория'" form @close="close" @submit="onSubmit">
    <div class="cat-form">
      <div class="smart-field">
        <span class="smart-field__label">Название <span class="cat-form__req">*</span></span>
        <input v-model="draft.title" type="text" placeholder="Например, Каши" maxlength="40" />
        <span v-if="titleError" class="ui-errors">
          <span class="ui-error">{{ titleError }}</span>
        </span>
        <span v-else-if="draft.title.trim()" class="cat-form__slug">Адрес: /c/{{ slug }}</span>
      </div>

      <div class="cat-form__photo-block">
        <span class="smart-field__label">Фото плитки</span>
        <button
          type="button"
          class="cat-form__photo"
          :disabled="isUploading"
          @click="fileInput?.click()"
        >
          <ImagePlaceholder
            :src="draft.image_url"
            :tone="CategoryVisuals.tone(slug)"
            hint="Без фото плитка соберётся из фото блюд"
            :alt="draft.title"
          />
          <span class="cat-form__photo-badge">
            <ImagePlus :size="16" /> {{ draft.image_url ? 'Заменить' : 'Загрузить' }}
          </span>
          <span v-if="isUploading" class="cat-form__photo-loading">
            <Loader2 :size="26" class="cat-form__spin" />
          </span>
        </button>
        <button
          v-if="draft.image_url"
          type="button"
          class="cat-form__photo-remove"
          @click="draft.image_url = null"
        >
          Убрать фото — собирать из блюд
        </button>
        <input ref="fileInput" type="file" accept="image/*" hidden @change="onPick" />
      </div>
    </div>

    <template #footer>
      <ModalBtn variant="ghost" @click="close">Отмена</ModalBtn>
      <ModalBtn variant="primary" type="submit" :loading="isSaving" :disabled="isUploading">
        {{ isNew ? 'Создать' : 'Сохранить' }}
      </ModalBtn>
    </template>
  </ModalCard>
</template>

<style scoped lang="scss">
.cat-form {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__req {
    color: $color-danger;
    font-weight: 800;
  }

  &__slug {
    font-size: 12px;
    color: $color-muted;
  }

  &__photo-block {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__photo {
    position: relative;
    aspect-ratio: 4 / 3;
    border-radius: $radius;
    overflow: hidden;
    box-shadow: $shadow-soft;

    &-badge {
      position: absolute;
      left: 10px;
      bottom: 10px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      border-radius: $radius-pill;
      background: rgba(255, 253, 248, 0.92);
      font-weight: 700;
      font-size: 13px;
    }
    &-loading {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 253, 248, 0.6);
      color: $color-accent;
    }
    &-remove {
      align-self: flex-start;
      font-size: 13px;
      font-weight: 700;
      color: $color-muted;
      @include anim(color);
      &:hover {
        color: $color-danger;
      }
    }
  }

  &__spin {
    animation: cat-form-spin 1s linear infinite;
  }
}

@keyframes cat-form-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
