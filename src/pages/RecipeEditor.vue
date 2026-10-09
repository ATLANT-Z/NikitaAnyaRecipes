<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useEventListener } from '@vueuse/core'
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  Check,
  Loader2,
  ImagePlus,
  X,
  ShoppingBasket,
  Repeat2,
  ChefHat,
  Coins,
  Flame,
  Refrigerator,
} from 'lucide-vue-next'
import { TimeHelper } from '@/services/helpers/number.helper'
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
      resizeSteps()
    } catch {
      notifications.error('Рецепт не найден')
      router.replace({ name: 'home' })
    }
  }
})

// ─── Быстрый ввод: фокус сразу в новое поле, клавиатура не прячется ───
// Поля помечены data-field="<ключ>"; ключи строим от id строк.
async function focusField(key: string) {
  await nextTick()
  document.querySelector<HTMLElement>(`[data-field="${key}"]`)?.focus()
}

function addSection() {
  const section = RecipeFactory.section(draft.value!.sections.length + 1)
  draft.value!.sections.push(section)
  focusField(`section-${section.id}-title`)
}

// Непустую секцию удаляем только после подтверждения — там может быть много ввода.
function isSectionEmpty(s: RecipeDto['sections'][number]): boolean {
  return (
    !s.title.trim() &&
    !s.servings?.trim() &&
    s.cost == null &&
    !s.kbju &&
    s.ingredients.every((i) => !i.name.trim() && !i.amount.trim()) &&
    s.substitutions.every((x) => !x.text.trim()) &&
    s.steps.every((x) => !x.trim()) &&
    s.storage.every((x) => !x.place.trim() && !x.duration.trim())
  )
}
async function removeSection(i: number) {
  const s = draft.value!.sections[i]
  if (!isSectionEmpty(s)) {
    const ok = await modals.show('confirm', {
      props: {
        title: `Удалить секцию${s.title.trim() ? ` «${s.title.trim()}»` : ` ${i + 1}`}?`,
        message: 'Ингредиенты и шаги этой секции пропадут.',
        confirmText: 'Удалить',
        danger: true,
      },
    }).wait
    if (!ok) return
  }
  draft.value!.sections.splice(i, 1)
}

// Перестановка секций; после неё подводим экран к перемещённой карточке.
async function moveSection(from: number, to: number) {
  const sections = draft.value!.sections
  if (to < 0 || to >= sections.length) return
  const [moved] = sections.splice(from, 1)
  sections.splice(to, 0, moved)
  await nextTick()
  document
    .getElementById(`ed-section-${moved.id}`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  resizeSteps()
}

function addIngredient(si: number) {
  const ing = RecipeFactory.ingredient()
  draft.value!.sections[si].ingredients.push(ing)
  focusField(`ing-${ing.id}-amount`)
}
function removeIngredient(si: number, ii: number) {
  draft.value!.sections[si].ingredients.splice(ii, 1)
}
// Enter: количество → название → следующая строка (на последней — новая).
function onIngredientEnter(si: number, ii: number, part: 'name' | 'amount') {
  const list = draft.value!.sections[si].ingredients
  if (part === 'amount') return focusField(`ing-${list[ii].id}-name`)
  if (ii === list.length - 1) return addIngredient(si)
  focusField(`ing-${list[ii + 1].id}-amount`)
}

function addSub(si: number) {
  const sub = RecipeFactory.substitution()
  draft.value!.sections[si].substitutions.push(sub)
  focusField(`sub-${sub.id}`)
}
function removeSub(si: number, i: number) {
  draft.value!.sections[si].substitutions.splice(i, 1)
}

function addStep(si: number) {
  const s = draft.value!.sections[si]
  s.steps.push('')
  focusField(`step-${s.id}-${s.steps.length - 1}`)
}
function removeStep(si: number, i: number) {
  draft.value!.sections[si].steps.splice(i, 1)
  resizeSteps()
}
function moveStep(si: number, from: number, to: number) {
  const steps = draft.value!.sections[si].steps
  if (to < 0 || to >= steps.length) return
  const [moved] = steps.splice(from, 1)
  steps.splice(to, 0, moved)
  resizeSteps()
}

// Поле шага растёт по высоте вместе с текстом (без ручного «уголка»).
function autosize(el: HTMLTextAreaElement) {
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight + 2}px`
}
async function resizeSteps() {
  await nextTick()
  document.querySelectorAll<HTMLTextAreaElement>('textarea[data-autosize]').forEach(autosize)
}

function addStorage(si: number) {
  const st = RecipeFactory.storage()
  draft.value!.sections[si].storage.push(st)
  focusField(`storage-${st.id}-place`)
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
    const first = document.querySelector('.ui-errors, .ed-error')
    first?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // Ставим курсор в первое незаполненное поле — сразу можно печатать.
    first
      ?.closest('.smart-field')
      ?.querySelector<HTMLElement>('input, select, textarea')
      ?.focus({ preventScroll: true })
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
          <span v-else-if="draft.time_minutes >= 60" class="ed-hint">
            = {{ TimeHelper.duration(draft.time_minutes) }}
          </span>
        </div>
      </div>

      <!-- Секции -->
      <section
        v-for="(s, si) in draft.sections"
        :id="`ed-section-${s.id}`"
        :key="s.id"
        class="ed-section"
      >
        <div class="ed-section__head">
          <span class="ed-section__label">
            <span class="ed-section__num">{{ si + 1 }}</span> Секция
          </span>
          <div v-if="draft.sections.length > 1" class="ed-section__tools">
            <button
              type="button"
              class="ed-mini"
              aria-label="Секцию выше"
              :disabled="si === 0"
              @click="moveSection(si, si - 1)"
            >
              <ChevronUp :size="18" />
            </button>
            <button
              type="button"
              class="ed-mini"
              aria-label="Секцию ниже"
              :disabled="si === draft.sections.length - 1"
              @click="moveSection(si, si + 1)"
            >
              <ChevronDown :size="18" />
            </button>
            <button
              type="button"
              class="ed-mini ed-mini--danger"
              aria-label="Удалить секцию"
              @click="removeSection(si)"
            >
              <Trash2 :size="17" />
            </button>
          </div>
        </div>
        <div class="smart-field">
          <input
            v-model="s.title"
            type="text"
            aria-label="Название секции"
            placeholder="Название: Тесто, Крем, Основа…"
            :data-field="`section-${s.id}-title`"
          />
        </div>

        <!-- Ингредиенты: количество → название; Enter ведёт дальше -->
        <div class="ed-block">
          <p class="ed-block__caption">
            <ShoppingBasket :size="16" /> Ингредиенты <span class="ed-req">*</span>
            <span v-if="s.ingredients.some((i) => i.name.trim())" class="ed-block__count">
              {{ s.ingredients.filter((i) => i.name.trim()).length }}
            </span>
          </p>
          <div v-if="s.ingredients.length" class="ed-cols" aria-hidden="true">
            <span class="ed-row__amount">Сколько</span>
            <span class="ed-row__grow">Что</span>
            <span class="ed-cols__spacer" />
          </div>
          <div v-for="(ing, ii) in s.ingredients" :key="ing.id" class="ed-row ed-row--top">
            <div class="smart-field ed-row__amount">
              <input
                v-model="ing.amount"
                type="text"
                placeholder="500 г"
                aria-label="Количество"
                enterkeyhint="next"
                :data-field="`ing-${ing.id}-amount`"
                @keydown.enter.prevent="onIngredientEnter(si, ii, 'amount')"
              />
            </div>
            <div class="smart-field ed-row__grow">
              <input
                v-model="ing.name"
                type="text"
                placeholder="мука"
                aria-label="Ингредиент"
                enterkeyhint="next"
                :data-field="`ing-${ing.id}-name`"
                @keydown.enter.prevent="onIngredientEnter(si, ii, 'name')"
              />
              <span v-if="fieldError('sections', si, 'ingredients', ii, 'name')" class="ui-errors">
                <span class="ui-error">
                  {{ fieldError('sections', si, 'ingredients', ii, 'name') }}
                </span>
              </span>
            </div>
            <button
              type="button"
              class="ed-row__del"
              aria-label="Удалить ингредиент"
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
        </div>

        <!-- Замены -->
        <div class="ed-block">
          <p class="ed-block__caption"><Repeat2 :size="16" /> Замены</p>
          <p class="ed-hint">
            Пометьте ингредиент значком (мука*), а здесь напишите, чем его заменить
          </p>
          <div v-for="(sub, i) in s.substitutions" :key="sub.id" class="ed-row">
            <div class="smart-field ed-row__marker">
              <input v-model="sub.marker" type="text" placeholder="*" aria-label="Значок" />
            </div>
            <div class="smart-field ed-row__grow">
              <input
                v-model="sub.text"
                type="text"
                placeholder="сметану — на йогурт"
                aria-label="Замена"
                :data-field="`sub-${sub.id}`"
              />
            </div>
            <button
              type="button"
              class="ed-row__del"
              aria-label="Удалить замену"
              @click="removeSub(si, i)"
            >
              <Trash2 :size="16" />
            </button>
          </div>
          <AppButton variant="dashed" block @click="addSub(si)">
            <Plus :size="16" /> Замена
          </AppButton>
        </div>

        <!-- Приготовление: поле растёт по тексту, шаги можно переставлять -->
        <div class="ed-block">
          <p class="ed-block__caption">
            <ChefHat :size="16" /> Приготовление
            <span v-if="s.steps.some((x) => x.trim())" class="ed-block__count">
              {{ s.steps.filter((x) => x.trim()).length }}
            </span>
          </p>
          <div v-for="(_, i) in s.steps" :key="i" class="ed-row ed-row--top">
            <span class="ed-row__num">{{ i + 1 }}</span>
            <div class="smart-field ed-row__grow">
              <textarea
                v-model="s.steps[i]"
                rows="2"
                placeholder="Что делаем на этом шаге"
                :aria-label="`Шаг ${i + 1}`"
                data-autosize
                :data-field="`step-${s.id}-${i}`"
                @input="autosize($event.target as HTMLTextAreaElement)"
              />
            </div>
            <div class="ed-row__tools">
              <template v-if="s.steps.length > 1">
                <button
                  type="button"
                  class="ed-mini"
                  aria-label="Шаг выше"
                  :disabled="i === 0"
                  @click="moveStep(si, i, i - 1)"
                >
                  <ChevronUp :size="16" />
                </button>
                <button
                  type="button"
                  class="ed-mini"
                  aria-label="Шаг ниже"
                  :disabled="i === s.steps.length - 1"
                  @click="moveStep(si, i, i + 1)"
                >
                  <ChevronDown :size="16" />
                </button>
              </template>
              <button
                type="button"
                class="ed-mini ed-mini--danger"
                aria-label="Удалить шаг"
                @click="removeStep(si, i)"
              >
                <Trash2 :size="15" />
              </button>
            </div>
          </div>
          <AppButton variant="dashed" block @click="addStep(si)">
            <Plus :size="16" /> Шаг
          </AppButton>
        </div>

        <!-- Порция и стоимость -->
        <div class="ed-block">
          <p class="ed-block__caption"><Coins :size="16" /> Порция и стоимость</p>
          <div class="editor__row">
            <div class="smart-field editor__row-grow">
              <span class="smart-field__label">Порция</span>
              <input v-model="s.servings" type="text" placeholder="1 форма / 4 порции" />
            </div>
            <div class="smart-field editor__cost">
              <span class="smart-field__label">Стоимость, ₽</span>
              <input
                v-model.number="s.cost"
                type="number"
                min="0"
                inputmode="numeric"
                placeholder="300"
              />
            </div>
          </div>
        </div>

        <!-- КБЖУ -->
        <div class="ed-block">
          <div class="ed-kbju-head">
            <p class="ed-block__caption"><Flame :size="16" /> КБЖУ</p>
            <button
              v-if="s.kbju"
              type="button"
              class="ed-kbju-head__remove"
              @click="removeKbju(si)"
            >
              Убрать
            </button>
          </div>
          <div v-if="s.kbju" class="ed-kbju">
            <div class="smart-field">
              <span class="smart-field__label">Ккал</span>
              <input v-model.number="s.kbju.cal" type="number" min="0" inputmode="decimal" />
            </div>
            <div class="smart-field">
              <span class="smart-field__label">Белки</span>
              <input v-model.number="s.kbju.prot" type="number" min="0" inputmode="decimal" />
            </div>
            <div class="smart-field">
              <span class="smart-field__label">Жиры</span>
              <input v-model.number="s.kbju.fat" type="number" min="0" inputmode="decimal" />
            </div>
            <div class="smart-field">
              <span class="smart-field__label">Углев.</span>
              <input v-model.number="s.kbju.carb" type="number" min="0" inputmode="decimal" />
            </div>
          </div>
          <AppButton v-else variant="dashed" block @click="addKbju(si)">
            <Plus :size="16" /> Добавить КБЖУ
          </AppButton>
        </div>

        <!-- Хранение -->
        <div class="ed-block">
          <p class="ed-block__caption"><Refrigerator :size="16" /> Хранение</p>
          <div v-for="(st, i) in s.storage" :key="st.id" class="ed-row">
            <div class="smart-field ed-row__grow">
              <input
                v-model="st.place"
                type="text"
                placeholder="В холодильнике"
                aria-label="Где хранить"
                :data-field="`storage-${st.id}-place`"
              />
            </div>
            <div class="smart-field ed-row__grow">
              <input
                v-model="st.duration"
                type="text"
                placeholder="до 1 недели"
                aria-label="Сколько хранить"
              />
            </div>
            <button
              type="button"
              class="ed-row__del"
              aria-label="Удалить условие хранения"
              @click="removeStorage(si, i)"
            >
              <Trash2 :size="16" />
            </button>
          </div>
          <AppButton variant="dashed" block @click="addStorage(si)">
            <Plus :size="16" /> Условие хранения
          </AppButton>
        </div>
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
  &__cost {
    width: 116px;
    flex: 0 0 auto;
  }

  // Липкая кнопка сохранения: подложка «растворяет» поля под ней,
  // чтобы они не просвечивали сквозь кнопку.
  &__save {
    position: sticky;
    bottom: 0;
    z-index: 5;
    @include safe-bottom(12px);
    padding-top: 20px;
    margin-top: -12px;
    background: linear-gradient(180deg, transparent, $color-page-bg 45%);
  }
}

.ed-section {
  @include card($radius-lg);
  padding: 16px 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scroll-margin-top: 76px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 36px;
  }
  &__label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 800;
    font-size: 15px;
    color: $color-heading;
  }
  &__num {
    width: 26px;
    height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-pill;
    background: $color-sun-dim;
    color: color-mix(in srgb, $color-sun 45%, $color-text);
    font-size: 13px;
  }
  &__tools {
    display: flex;
    gap: 2px;
  }
}

// Подблок секции (ингредиенты, замены, шаги…): иконка + подпись + счётчик,
// между блоками — пунктир, чтобы длинная секция читалась по частям.
.ed-block {
  display: flex;
  flex-direction: column;
  gap: 10px;

  & + & {
    padding-top: 14px;
    border-top: 1px dashed $color-border;
  }

  &__caption {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: $color-muted;
  }
  &__count {
    @include pill;
    padding: 1px 8px;
    font-size: 12px;
    letter-spacing: 0;
    background: $color-accent-dim;
    color: color-mix(in srgb, $color-accent 70%, $color-text);
    font-variant-numeric: tabular-nums;
  }
}

// Шапка колонок ингредиентов «Сколько / Что».
.ed-cols {
  display: flex;
  gap: 8px;
  margin-bottom: -4px;
  font-size: 12px;
  font-weight: 600;
  color: $color-muted;
  &__spacer {
    width: 36px;
    flex: 0 0 auto;
  }
}

.ed-hint {
  font-size: 12px;
  line-height: 1.35;
  color: $color-muted;
}

// Маленькая кнопка-иконка (порядок, удаление) — 36px, тап по пальцу.
.ed-mini {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  color: $color-muted;
  @include anim(color);
  transition-property: color, background-color;

  &:hover:not(:disabled) {
    color: $color-text;
    background: $color-surface-2;
  }
  &:disabled {
    opacity: 0.3;
  }
  &--danger:hover:not(:disabled) {
    color: $color-danger;
    background: rgba($color-danger, 0.08);
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

  // Строки, где под полем может появиться ошибка / растёт textarea:
  // кнопки держим вверху, на уровне поля.
  &--top {
    align-items: flex-start;
    .ed-row__num {
      margin-top: 10px;
    }
  }

  &__grow {
    flex: 1;
    min-width: 0;
  }
  &__amount {
    width: 96px;
    flex: 0 0 auto;
  }
  &__tools {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    .ed-mini {
      height: 30px;
    }
  }
  &--top &__del {
    margin-top: 4px;
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
