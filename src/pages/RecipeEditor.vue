<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useEventListener } from '@vueuse/core'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Check,
  Loader2,
  ImagePlus,
  X,
} from 'lucide-vue-next'
import type { RecipeDto } from '@/api/recipes/resources/recipe.resource'
import { recipesRepository } from '@/repository/recipes.repository'
import { RecipeFactory } from '@/features/recipes/lib/recipe-factory'
import { RecipeSchema } from '@/features/recipes/forms/recipe.form'
import { useRecipeSave } from '@/features/recipes/model/useRecipeSave'
import { useCategories } from '@/features/categories/model/useCategories'
import { useNotificationsStore } from '@/_shared/stores/notifications'
import { useHandleError } from '@/_shared/composables/useHandleError'
import { useModals } from '@/services/modal.service'
import AppScreen from '@/shared/ui/AppScreen.vue'
import AppHeader from '@/shared/ui/AppHeader.vue'
import IconButton from '@/shared/ui/IconButton.vue'
import AppButton from '@/shared/ui/AppButton.vue'
import Skeleton from '@/shared/ui/Skeleton.vue'

const route = useRoute()
const router = useRouter()
const notifications = useNotificationsStore()
const { handleError } = useHandleError()
const modals = useModals()
const { categories } = useCategories()
const { save, remove, isSaving } = useRecipeSave()

const editId = route.params.id as string | undefined
const isNew = !editId
const draft = ref<RecipeDto | null>(null)

// ─── Защита от потери черновика ───
// Снимок на момент загрузки; отличие → «есть несохранённые изменения».
const snapshot = ref('')
const isLeaving = ref(false) // сохранили/удалили — уходим без вопросов
const isDirty = computed(
  () => !!draft.value && !isLeaving.value && JSON.stringify(draft.value) !== snapshot.value,
)

onBeforeRouteLeave(async () => {
  if (!isDirty.value) return true
  const ok = await modals.show('confirm', {
    props: {
      title: 'Выйти без сохранения?',
      message: 'Введённые изменения пропадут.',
      confirmText: 'Выйти',
      danger: true,
    },
  }).wait
  return !!ok
})

// Закрытие/обновление вкладки браузера.
useEventListener(window, 'beforeunload', (e: BeforeUnloadEvent) => {
  if (isDirty.value) e.preventDefault()
})

onMounted(async () => {
  if (isNew) {
    // Категорию берём из адреса; нет — пусто, валидация попросит выбрать.
    draft.value = RecipeFactory.recipe((route.query.category as string) || '')
    snapshot.value = JSON.stringify(draft.value)
  } else {
    try {
      const recipe = RecipeFactory.clone(await recipesRepository.get(editId!))
      // Старые записи (до галереи): одиночную обложку делаем первым фото.
      recipe.images ??= []
      if (!recipe.images.length && recipe.cover_url) {
        recipe.images.push(RecipeFactory.image(recipe.cover_url))
      }
      draft.value = recipe
      snapshot.value = JSON.stringify(recipe)
    } catch {
      notifications.error('Рецепт не найден')
      router.replace({ name: 'home' })
    }
  }
})

function addSection() {
  draft.value!.sections.push(RecipeFactory.section(draft.value!.sections.length + 1))
}
function removeSection(i: number) {
  draft.value!.sections.splice(i, 1)
}
function addIngredient(si: number) {
  draft.value!.sections[si].ingredients.push(RecipeFactory.ingredient())
}
function removeIngredient(si: number, ii: number) {
  draft.value!.sections[si].ingredients.splice(ii, 1)
}
function addSub(si: number) {
  draft.value!.sections[si].substitutions.push(RecipeFactory.substitution())
}
function removeSub(si: number, i: number) {
  draft.value!.sections[si].substitutions.splice(i, 1)
}
function addStep(si: number) {
  draft.value!.sections[si].steps.push('')
}
function removeStep(si: number, i: number) {
  draft.value!.sections[si].steps.splice(i, 1)
}
function addStorage(si: number) {
  draft.value!.sections[si].storage.push(RecipeFactory.storage())
}
function removeStorage(si: number, i: number) {
  draft.value!.sections[si].storage.splice(i, 1)
}
function addKbju(si: number) {
  draft.value!.sections[si].kbju = RecipeFactory.kbju()
}
function removeKbju(si: number) {
  draft.value!.sections[si].kbju = null
}

// Убираем пустые строки перед сохранением; порядок секций и обложку
// выводим из текущего порядка (сервер всё равно перепроверит cover_url).
function clean(recipe: RecipeDto): RecipeDto {
  const r = RecipeFactory.clone(recipe)
  r.cover_url = r.images[0]?.url ?? null
  r.sections.forEach((s, i) => (s.sort_order = i + 1))
  for (const s of r.sections) {
    s.title = s.title.trim()
    s.ingredients = s.ingredients.filter((i) => i.name.trim())
    s.substitutions = s.substitutions.filter((x) => x.text.trim())
    s.steps = s.steps.map((x) => x.trim()).filter(Boolean)
    s.storage = s.storage.filter((x) => x.place.trim())
  }
  return r
}

// Инлайн-валидация. Показываем ошибки прямо в форме (не тостом — его легко
// пропустить / прячется за шапкой Telegram). Появляются после первой попытки
// сохранить и сами гаснут, как поле заполнили (реактивный computed).
const submitted = ref(false)
const errors = computed<Record<string, string>>(() => {
  if (!submitted.value || !draft.value) return {}

  const parsed = RecipeSchema.safeParse(draft.value)
  if (parsed.success) return {}

  const map: Record<string, string> = {}
  for (const issue of parsed.error.issues) {
    const key = issue.path.join('.')
    if (!(key in map)) map[key] = issue.message // первое сообщение на поле
  }
  return map
})
function fieldError(...parts: (string | number)[]): string | undefined {
  return errors.value[parts.join('.')]
}

async function onSave() {
  submitted.value = true

  await nextTick()

  if (Object.keys(errors.value).length) {
    document
      .querySelector('.ui-errors, .ed-error')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }

  const cleaned = clean(draft.value!)
  try {
    await save(cleaned)
  } catch {
    return // тост с причиной показал useRecipeSave; черновик остаётся на месте
  }
  isLeaving.value = true
  notifications.success(isNew ? 'Рецепт создан' : 'Сохранено')
  router.replace({ name: 'recipe', params: { id: cleaned.id } })
}

async function onDelete() {
  const ok = await modals.show('confirm', {
    props: {
      title: 'Удалить рецепт?',
      message: 'Действие необратимо.',
      confirmText: 'Удалить',
      danger: true,
    },
  }).wait
  if (!ok) return
  try {
    await remove(editId!)
  } catch {
    return
  }
  isLeaving.value = true
  notifications.success('Рецепт удалён')
  router.replace({ name: 'home' })
}

// ─── Галерея фото: мультизагрузка, порядок кнопками, первое = обложка ───
const photoInput = ref<HTMLInputElement | null>(null)
const upload = ref<{ done: number; total: number } | null>(null) // прогресс пачки

function pickPhotos() {
  photoInput.value?.click()
}

async function onPhotosPick(e: Event) {
  const input = e.target as HTMLInputElement
  const files = [...(input.files ?? [])]
  input.value = '' // сбрасываем — чтобы повторный выбор тех же файлов сработал
  if (!files.length || !draft.value) return

  // Грузим по одному: удачные сразу появляются в галерее, ошибка одного
  // файла не роняет остальные.
  upload.value = { done: 0, total: files.length }
  for (const file of files) {
    try {
      const url = await recipesRepository.uploadImage(draft.value.id, file)
      draft.value.images.push(RecipeFactory.image(url))
    } catch (err) {
      handleError(err)
    }
    upload.value.done++
  }
  upload.value = null
}

function movePhoto(from: number, to: number) {
  const images = draft.value!.images
  if (to < 0 || to >= images.length) return
  const [moved] = images.splice(from, 1)
  images.splice(to, 0, moved)
}

function removePhoto(i: number) {
  draft.value!.images.splice(i, 1)
}
</script>

<template>
  <AppScreen>
    <AppHeader :title="isNew ? 'Новый рецепт' : 'Редактирование'">
      <template #left>
        <IconButton label="Назад" @click="router.back()">
          <ChevronLeft :size="24" />
        </IconButton>
      </template>
      <template #right>
        <IconButton v-if="!isNew" label="Удалить" @click="onDelete">
          <Trash2 :size="20" />
        </IconButton>
      </template>
    </AppHeader>

    <div v-if="!draft" class="editor__loading">
      <Skeleton height="200px" radius="20px" />
      <Skeleton height="48px" radius="14px" />
      <Skeleton height="240px" radius="20px" />
    </div>

    <div v-else class="editor">
      <!-- Фото блюда: первое — обложка; порядок меняется стрелками -->
      <div class="gallery">
        <div class="gallery__head">
          <span class="smart-field__label">Фото блюда</span>
          <span v-if="draft.images.length > 1" class="gallery__hint">
            Первое — обложка. Порядок — стрелками
          </span>
        </div>

        <!-- Пусто: крупная зона добавления -->
        <button
          v-if="!draft.images.length"
          type="button"
          class="gallery__empty"
          :disabled="!!upload"
          @click="pickPhotos"
        >
          <template v-if="upload">
            <Loader2 :size="28" class="gallery__spin" />
            <span>Загружаю {{ upload.done + 1 }} из {{ upload.total }}…</span>
          </template>
          <template v-else>
            <ImagePlus :size="32" />
            <span>Добавить фото</span>
            <span class="gallery__empty-sub">можно выбрать сразу несколько</span>
          </template>
        </button>

        <TransitionGroup v-else tag="div" name="gallery-move" class="gallery__grid">
          <div v-for="(img, i) in draft.images" :key="img.id" class="gallery__item">
            <img :src="img.url" :alt="`Фото ${i + 1}`" class="gallery__img" />
            <span v-if="i === 0" class="gallery__badge">Обложка</span>
            <button
              type="button"
              class="gallery__remove"
              aria-label="Удалить фото"
              @click="removePhoto(i)"
            >
              <X :size="16" />
            </button>
            <div v-if="draft.images.length > 1" class="gallery__controls">
              <button
                type="button"
                class="gallery__move"
                aria-label="Сдвинуть влево"
                :disabled="i === 0"
                @click="movePhoto(i, i - 1)"
              >
                <ChevronLeft :size="18" />
              </button>
              <span class="gallery__pos">{{ i + 1 }}</span>
              <button
                type="button"
                class="gallery__move"
                aria-label="Сдвинуть вправо"
                :disabled="i === draft.images.length - 1"
                @click="movePhoto(i, i + 1)"
              >
                <ChevronRight :size="18" />
              </button>
            </div>
          </div>

          <!-- Плитка «ещё фото» в конце сетки -->
          <button
            key="__add"
            type="button"
            class="gallery__add"
            :disabled="!!upload"
            aria-label="Добавить ещё фото"
            @click="pickPhotos"
          >
            <template v-if="upload">
              <Loader2 :size="22" class="gallery__spin" />
              <span>{{ upload.done + 1 }}/{{ upload.total }}</span>
            </template>
            <template v-else>
              <ImagePlus :size="24" />
              <span>Ещё</span>
            </template>
          </button>
        </TransitionGroup>

        <input
          ref="photoInput"
          type="file"
          accept="image/*"
          multiple
          hidden
          @change="onPhotosPick"
        />
      </div>

      <!-- Название / категория / время -->
      <div class="smart-field">
        <span class="smart-field__label">Название <span class="ed-req">*</span></span>
        <input v-model="draft.title" type="text" placeholder="Например, Кулич" />
        <span v-if="fieldError('title')" class="ui-errors">
          <span class="ui-error">{{ fieldError('title') }}</span>
        </span>
      </div>

      <div class="editor__row">
        <div class="smart-field editor__row-grow">
          <span class="smart-field__label">Категория <span class="ed-req">*</span></span>
          <select v-model="draft.category_slug">
            <option value="" disabled>Выберите…</option>
            <option v-for="c in categories" :key="c.id" :value="c.slug">{{ c.title }}</option>
          </select>
          <span v-if="fieldError('category_slug')" class="ui-errors">
            <span class="ui-error">{{ fieldError('category_slug') }}</span>
          </span>
        </div>
        <div class="smart-field editor__time">
          <span class="smart-field__label">Время, мин <span class="ed-req">*</span></span>
          <input v-model.number="draft.time_minutes" type="number" min="1" inputmode="numeric" />
          <span v-if="fieldError('time_minutes')" class="ui-errors">
            <span class="ui-error">{{ fieldError('time_minutes') }}</span>
          </span>
        </div>
      </div>

      <!-- Секции -->
      <section v-for="(s, si) in draft.sections" :key="s.id" class="ed-section">
        <div class="ed-section__head">
          <div class="smart-field ed-section__title">
            <span class="smart-field__label">Секция {{ si + 1 }}</span>
            <input v-model="s.title" type="text" placeholder="Тесто / Крем / Основа" />
          </div>
          <IconButton
            v-if="draft.sections.length > 1"
            label="Удалить секцию"
            variant="ghost"
            @click="removeSection(si)"
          >
            <Trash2 :size="18" />
          </IconButton>
        </div>

        <!-- Ингредиенты -->
        <p class="ed-section__caption">Ингредиенты <span class="ed-req">*</span></p>
        <div v-for="(ing, ii) in s.ingredients" :key="ing.id" class="ed-row">
          <div class="smart-field ed-row__amount">
            <input v-model="ing.amount" type="text" placeholder="кол-во" />
          </div>
          <div class="smart-field ed-row__grow">
            <input v-model="ing.name" type="text" placeholder="ингредиент" />
            <span v-if="fieldError('sections', si, 'ingredients', ii, 'name')" class="ui-errors">
              <span class="ui-error">{{ fieldError('sections', si, 'ingredients', ii, 'name') }}</span>
            </span>
          </div>
          <button
            type="button"
            class="ed-row__del"
            aria-label="Удалить"
            @click="removeIngredient(si, ii)"
          >
            <Trash2 :size="16" />
          </button>
        </div>
        <span v-if="fieldError('sections', si, 'ingredients')" class="ed-error">
          {{ fieldError('sections', si, 'ingredients') }}
        </span>
        <AppButton variant="dashed" block @click="addIngredient(si)">
          <Plus :size="16" /> Ингредиент
        </AppButton>

        <!-- Замены -->
        <p class="ed-section__caption">Замены</p>
        <div v-for="(sub, i) in s.substitutions" :key="sub.id" class="ed-row">
          <div class="smart-field ed-row__marker">
            <input v-model="sub.marker" type="text" placeholder="*" />
          </div>
          <div class="smart-field ed-row__grow">
            <input v-model="sub.text" type="text" placeholder="чем заменить" />
          </div>
          <button type="button" class="ed-row__del" aria-label="Удалить" @click="removeSub(si, i)">
            <Trash2 :size="16" />
          </button>
        </div>
        <AppButton variant="dashed" block @click="addSub(si)"><Plus :size="16" /> Замена</AppButton>

        <!-- Мета -->
        <p class="ed-section__caption">Порция и стоимость</p>
        <div class="editor__row">
          <div class="smart-field editor__row-grow">
            <span class="smart-field__label">Порция</span>
            <input v-model="s.servings" type="text" placeholder="1 форма" />
          </div>
          <div class="smart-field editor__time">
            <span class="smart-field__label">₽</span>
            <input v-model.number="s.cost" type="number" min="0" inputmode="numeric" />
          </div>
        </div>

        <!-- КБЖУ — по желанию -->
        <div class="ed-kbju-head">
          <p class="ed-section__caption">КБЖУ</p>
          <button v-if="s.kbju" type="button" class="ed-kbju-head__remove" @click="removeKbju(si)">
            Убрать
          </button>
        </div>
        <div v-if="s.kbju" class="ed-kbju">
          <div class="smart-field">
            <span class="smart-field__label">К</span>
            <input v-model.number="s.kbju.cal" type="number" min="0" inputmode="numeric" />
          </div>
          <div class="smart-field">
            <span class="smart-field__label">Б</span>
            <input v-model.number="s.kbju.prot" type="number" min="0" inputmode="numeric" />
          </div>
          <div class="smart-field">
            <span class="smart-field__label">Ж</span>
            <input v-model.number="s.kbju.fat" type="number" min="0" inputmode="numeric" />
          </div>
          <div class="smart-field">
            <span class="smart-field__label">У</span>
            <input v-model.number="s.kbju.carb" type="number" min="0" inputmode="numeric" />
          </div>
        </div>
        <AppButton v-else variant="dashed" block @click="addKbju(si)">
          <Plus :size="16" /> Добавить КБЖУ
        </AppButton>

        <!-- Шаги -->
        <p class="ed-section__caption">Шаги</p>
        <div v-for="(_, i) in s.steps" :key="i" class="ed-row">
          <span class="ed-row__num">{{ i + 1 }}</span>
          <div class="smart-field ed-row__grow">
            <textarea v-model="s.steps[i]" rows="2" placeholder="Опишите шаг" />
          </div>
          <button type="button" class="ed-row__del" aria-label="Удалить" @click="removeStep(si, i)">
            <Trash2 :size="16" />
          </button>
        </div>
        <AppButton variant="dashed" block @click="addStep(si)"><Plus :size="16" /> Шаг</AppButton>

        <!-- Хранение -->
        <p class="ed-section__caption">Хранение</p>
        <div v-for="(st, i) in s.storage" :key="st.id" class="ed-row">
          <div class="smart-field ed-row__grow">
            <input v-model="st.place" type="text" placeholder="В холодильнике" />
          </div>
          <div class="smart-field ed-row__grow">
            <input v-model="st.duration" type="text" placeholder="до 1 недели" />
          </div>
          <button
            type="button"
            class="ed-row__del"
            aria-label="Удалить"
            @click="removeStorage(si, i)"
          >
            <Trash2 :size="16" />
          </button>
        </div>
        <AppButton variant="dashed" block @click="addStorage(si)">
          <Plus :size="16" /> Условие хранения
        </AppButton>
      </section>

      <AppButton variant="soft" block @click="addSection">
        <Plus :size="18" /> Добавить секцию
      </AppButton>

      <!-- Сохранить -->
      <div class="editor__save">
        <AppButton variant="primary" block :loading="isSaving" @click="onSave">
          <Check :size="18" /> {{ isNew ? 'Создать рецепт' : 'Сохранить' }}
        </AppButton>
      </div>
    </div>
  </AppScreen>
</template>

<style scoped lang="scss">
.editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 40px;

  &__loading {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__row {
    display: flex;
    gap: 12px;
    &-grow {
      flex: 1;
    }
  }
  &__time {
    width: 96px;
    flex: 0 0 auto;
  }

  &__save {
    position: sticky;
    bottom: 0;
    @include safe-bottom(12px);
    padding-top: 8px;
  }
}

.ed-section {
  @include card($radius-lg);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__head {
    display: flex;
    align-items: flex-end;
    gap: 8px;
  }
  &__title {
    flex: 1;
  }
  &__caption {
    margin-top: 8px;
    font-weight: 700;
    font-size: 14px;
    color: $color-muted;
  }
}

.ed-req {
  color: $color-danger;
  font-weight: 800;
}

// ─── Галерея фото ───
.gallery {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }
  &__hint {
    font-size: 12px;
    color: $color-muted;
    text-align: right;
  }

  // Пустое состояние — крупная пунктирная зона.
  &__empty {
    aspect-ratio: 16 / 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: 2px dashed $color-border;
    border-radius: $radius-lg;
    background: $color-surface;
    color: $color-muted;
    font-weight: 700;
    @include anim(border-color);
    transition-property: border-color, color;

    &:hover:not(:disabled) {
      border-color: $color-accent;
      color: $color-text;
    }
    &-sub {
      font-weight: 500;
      font-size: 12px;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;

    @media (min-width: 560px) {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  &__item {
    position: relative;
    aspect-ratio: 4 / 3;
    border-radius: $radius;
    overflow: hidden;
    box-shadow: $shadow-soft;
    background: $color-surface-2;
  }
  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__badge {
    position: absolute;
    top: 8px;
    left: 8px;
    @include pill;
    padding: 3px 10px;
    font-size: 12px;
    font-weight: 800;
    background: $color-sun;
    color: $color-heading;
  }

  &__remove {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-pill;
    background: rgba(255, 253, 248, 0.9);
    color: $color-text;
    box-shadow: $shadow-soft;
    @include anim(color);
    &:hover {
      color: $color-danger;
    }
  }

  // Полоска управления порядком внизу фото.
  &__controls {
    position: absolute;
    left: 6px;
    right: 6px;
    bottom: 6px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2px;
    border-radius: $radius-pill;
    background: rgba(255, 253, 248, 0.92);
    box-shadow: $shadow-soft;
  }
  &__move {
    width: 40px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-pill;
    color: $color-text;
    @include anim(background-color);
    &:hover:not(:disabled) {
      background: $color-accent-dim;
    }
    &:disabled {
      opacity: 0.3;
    }
  }
  &__pos {
    font-size: 13px;
    font-weight: 800;
    color: $color-muted;
  }

  &__add {
    aspect-ratio: 4 / 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border: 2px dashed $color-border;
    border-radius: $radius;
    color: $color-muted;
    font-weight: 700;
    font-size: 13px;
    @include anim(border-color);
    transition-property: border-color, color;
    &:hover:not(:disabled) {
      border-color: $color-accent;
      color: $color-text;
    }
  }

  &__spin {
    animation: cover-spin 1s linear infinite;
  }
}

// Плавная перестановка фото (TransitionGroup).
.gallery-move-move {
  transition: transform $anim $ease-soft;
}

.ed-error {
  display: block;
  margin-top: -2px;
  font-size: 12px;
  line-height: 1.3;
  color: $color-danger;
}

.ed-row {
  display: flex;
  align-items: center;
  gap: 8px;

  &__grow {
    flex: 1;
  }
  &__amount {
    width: 84px;
    flex: 0 0 auto;
  }
  &__marker {
    width: 54px;
    flex: 0 0 auto;
  }
  &__num {
    flex: 0 0 auto;
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-pill;
    background: $color-accent-dim;
    color: color-mix(in srgb, $color-accent 70%, $color-text);
    font-weight: 800;
    font-size: 13px;
  }
  &__del {
    flex: 0 0 auto;
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    color: $color-muted;
    @include anim(color);
    &:hover {
      color: $color-danger;
      background: rgba($color-danger, 0.08);
    }
  }
}

@keyframes cover-spin {
  to {
    transform: rotate(360deg);
  }
}

.ed-kbju {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.ed-kbju-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;

  &__remove {
    flex: 0 0 auto;
    font-size: 13px;
    font-weight: 700;
    color: $color-muted;
    @include anim(color);
    &:hover {
      color: $color-danger;
    }
  }
}
</style>
