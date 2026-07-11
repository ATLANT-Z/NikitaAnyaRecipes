<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, Plus, Trash2, Check, Loader2 } from 'lucide-vue-next'
import type { RecipeDto } from '@/api/recipes/resources/recipe.resource'
import { recipesRepository } from '@/repository/recipes.repository'
import { RecipeFactory } from '@/features/recipes/lib/recipe-factory'
import { RecipeSchema } from '@/features/recipes/forms/recipe.form'
import { useRecipeSave } from '@/features/recipes/model/useRecipeSave'
import { useCategories } from '@/features/categories/model/useCategories'
import { useNotificationsStore } from '@/_shared/stores/notifications'
import { useHandleError } from '@/_shared/composables/useHandleError'
import { useModals } from '@/services/modal.service'
import { TelegramHelper } from '@/_shared/telegram/telegram'
import { isSupabaseConfigured } from '@/_shared/supabase/isConfigured'
import AppScreen from '@/shared/ui/AppScreen.vue'
import AppHeader from '@/shared/ui/AppHeader.vue'
import IconButton from '@/shared/ui/IconButton.vue'
import ImagePlaceholder from '@/shared/ui/ImagePlaceholder.vue'
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

onMounted(async () => {
  if (isNew) {
    const category = (route.query.category as string) || 'dessert'
    draft.value = RecipeFactory.recipe(category)
  } else {
    try {
      draft.value = RecipeFactory.clone(await recipesRepository.get(editId!))
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

// Убираем пустые строки перед сохранением.
function clean(recipe: RecipeDto): RecipeDto {
  const r = RecipeFactory.clone(recipe)
  for (const s of r.sections) {
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
  const parsed = RecipeSchema.safeParse(clean(draft.value))
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

  // Сначала — валидность формы (инлайн-ошибки уже видны через computed).
  if (Object.keys(errors.value).length) {
    await nextTick()
    document
      .querySelector('.ui-errors')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }

  // Форма валидна. Запись идёт через Edge Function, которая проверяет подписанный
  // Telegram initData + права админа. С обычного сайта (в т.ч. с ?admin=1 — это
  // лишь превью edit-режима) подписи нет, поэтому сохранение сервер отклонит.
  if (isSupabaseConfigured && !TelegramHelper.isTelegram) {
    notifications.error('Сохранять рецепты можно только из приложения в Telegram')
    return
  }

  const cleaned = clean(draft.value!)
  await save(cleaned)
  debugger
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
  await remove(editId!)
  notifications.success('Рецепт удалён')
  router.replace({ name: 'home' })
}

const coverInput = ref<HTMLInputElement | null>(null)
const isUploadingCover = ref(false)

function pickCover() {
  if (isSupabaseConfigured && !TelegramHelper.isTelegram) {
    notifications.error('Загрузка обложек доступна только из приложения в Telegram')
    return
  }
  coverInput.value?.click()
}

async function onCoverPick(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // сбрасываем — чтобы повторный выбор того же файла сработал
  if (!file || !draft.value) return

  isUploadingCover.value = true
  try {
    draft.value.cover_url = await recipesRepository.uploadCover(draft.value.id, file)
  } catch (err) {
    handleError(err)
  } finally {
    isUploadingCover.value = false
  }
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
      <!-- Обложка -->
      <button
        type="button"
        class="editor__cover"
        :disabled="isUploadingCover"
        @click="pickCover"
      >
        <ImagePlaceholder
          :src="draft.cover_url"
          tone="neutral"
          hint="Нажмите, чтобы добавить фото"
        />
        <span class="editor__cover-badge">
          <Plus :size="18" /> {{ draft.cover_url ? 'Заменить' : 'Обложка' }}
        </span>
        <span v-if="isUploadingCover" class="editor__cover-loading">
          <Loader2 :size="28" class="editor__cover-spin" />
        </span>
      </button>
      <input
        ref="coverInput"
        type="file"
        accept="image/*"
        hidden
        @change="onCoverPick"
      />

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
            <span class="smart-field__label">Секция {{ si + 1 }} <span class="ed-req">*</span></span>
            <input v-model="s.title" type="text" placeholder="Тесто / Крем / Основа" />
            <span v-if="fieldError('sections', si, 'title')" class="ui-errors">
              <span class="ui-error">{{ fieldError('sections', si, 'title') }}</span>
            </span>
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

  &__cover {
    position: relative;
    aspect-ratio: 16 / 11;
    border-radius: $radius-lg;
    overflow: hidden;
    box-shadow: $shadow-card;
    &-badge {
      position: absolute;
      left: 12px;
      bottom: 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: $radius-pill;
      background: rgba(255, 253, 248, 0.9);
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
    &-spin {
      animation: cover-spin 1s linear infinite;
    }
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
