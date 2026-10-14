<script setup lang="ts">
import { computed } from 'vue'
import { Check, ChefHat, Coins, Refrigerator, ShoppingBasket } from 'lucide-vue-next'
import type { SectionDto } from '@/api/recipes/resources/recipe.resource'
import { NumberHelper } from '@/services/helpers/number.helper'
import { IngredientGroups } from '@/features/recipes/lib/ingredient-groups'
import AppCheckbox from '@/shared/ui/AppCheckbox.vue'

// Секция рецепта в «режиме готовки»: чек-лист ингредиентов, отмечаемые шаги,
// справка (КБЖУ/стоимость/хранение) — в конце, чтобы не разрывать
// «ингредиенты → шаги». Отметки локальные (см. useIngredientChecks).
interface Props {
  section: SectionDto
  isChecked: (id: string) => boolean
  onSet: (id: string, value: boolean) => void
}
const props = defineProps<Props>()

// Шаги без id — ключ отметки по позиции внутри секции.
const stepKey = (i: number) => `step:${props.section.id}:${i}`

// Группы ингредиентов: пунктир-разделитель только между группами.
const groups = computed(() => IngredientGroups.split(props.section.ingredients))
const items = computed(() => IngredientGroups.items(props.section.ingredients))
// Разделитель перед группой: у первой — только если у неё есть название.
const hasDivider = (gi: number) =>
  !!groups.value[gi].header?.name.trim() || (gi > 0 && groups.value.length > 1)

const checkedCount = computed(() => items.value.filter((i) => props.isChecked(i.id)).length)
const isAllChecked = computed(
  () => items.value.length > 0 && checkedCount.value === items.value.length,
)

const kbjuStats = computed(() => {
  const k = props.section.kbju
  if (!k) return []
  return [
    { value: k.cal, label: 'ккал' },
    { value: k.prot, label: 'белки' },
    { value: k.fat, label: 'жиры' },
    { value: k.carb, label: 'углеводы' },
  ]
})

const hasInfo = computed(
  () => !!props.section.kbju || props.section.cost != null || props.section.storage.length > 0,
)
</script>

<template>
  <section :id="`section-${section.id}`" class="section">
    <header v-if="section.title || section.servings" class="section__head">
      <h2 v-if="section.title" class="section__title">{{ section.title }}</h2>
      <span v-if="section.servings" class="section__servings">Порция: {{ section.servings }}</span>
    </header>

    <!-- Ингредиенты: чек-лист, тап по всей строке -->
    <div class="section__block">
      <p class="section__caption">
        <ShoppingBasket :size="16" /> Ингредиенты
        <span
          class="section__progress"
          :class="{ 'section__progress--done': isAllChecked }"
          :aria-label="`Отмечено ${checkedCount} из ${items.length}`"
        >
          {{ checkedCount }}/{{ items.length }}
        </span>
      </p>
      <div v-for="(g, gi) in groups" :key="g.key" class="ing-group">
        <p
          v-if="hasDivider(gi)"
          class="ing-group__divider"
          :class="{ 'ing-group__divider--plain': !g.header?.name.trim() }"
        >
          <span v-if="g.header?.name.trim()" class="ing-group__title">{{ g.header.name }}</span>
        </p>
        <ul class="ing-group__list">
          <li v-for="{ ing } in g.items" :key="ing.id">
            <AppCheckbox
              block
              dense
              :model-value="isChecked(ing.id)"
              @update:model-value="onSet(ing.id, $event)"
            >
              <span v-if="ing.amount" class="ing__amount">{{ ing.amount }}</span>
              {{ ing.name }}
            </AppCheckbox>
          </li>
        </ul>
      </div>

      <!-- Замены — сразу под ингредиентами, к которым относятся -->
      <div v-if="section.substitutions.length" class="section__subs">
        <p v-for="sub in section.substitutions" :key="sub.id" class="section__sub">
          <span class="section__sub-marker">{{ sub.marker }}</span> {{ sub.text }}
        </p>
      </div>
    </div>

    <!-- Шаги: тап отмечает сделанный -->
    <div v-if="section.steps.length" class="section__block">
      <p class="section__caption"><ChefHat :size="16" /> Приготовление</p>
      <ol class="section__steps">
        <li v-for="(step, i) in section.steps" :key="i">
          <button
            type="button"
            class="step"
            :class="{ 'step--done': isChecked(stepKey(i)) }"
            :aria-pressed="isChecked(stepKey(i))"
            @click="onSet(stepKey(i), !isChecked(stepKey(i)))"
          >
            <span class="step__num">
              <Check v-if="isChecked(stepKey(i))" :size="14" :stroke-width="3" />
              <template v-else>{{ i + 1 }}</template>
            </span>
            <span class="step__text">{{ step }}</span>
          </button>
        </li>
      </ol>
    </div>

    <!-- Справка: КБЖУ, стоимость, хранение -->
    <div v-if="hasInfo" class="section__info">
      <div v-if="kbjuStats.length" class="kbju" aria-label="КБЖУ">
        <div v-for="s in kbjuStats" :key="s.label" class="kbju__cell">
          <span class="kbju__value">{{ NumberHelper.format(s.value) }}</span>
          <span class="kbju__label">{{ s.label }}</span>
        </div>
      </div>

      <p v-if="section.cost != null" class="section__info-row">
        <Coins :size="16" /> Стоимость ≈ <b>{{ NumberHelper.money(section.cost) }}</b>
      </p>

      <div v-if="section.storage.length" class="section__info-row section__info-row--top">
        <Refrigerator :size="16" />
        <div class="section__storage">
          <p v-for="s in section.storage" :key="s.id">
            {{ s.place }} — <b>{{ s.duration }}</b>
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.section {
  @include card($radius-lg);
  padding: 20px 18px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  // Чтобы переход к секции не прятал заголовок под липкой шапкой.
  scroll-margin-top: 76px;

  &__head {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-align: center;
  }
  &__title {
    font-size: 21px;
  }
  &__servings {
    @include pill;
    background: $color-surface-2;
    color: $color-muted;
    font-weight: 600;
  }

  &__block {
    display: flex;
    flex-direction: column;
    gap: 10px;
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
  &__progress {
    margin-left: auto;
    @include pill;
    padding: 2px 10px;
    font-size: 12px;
    text-transform: none;
    letter-spacing: 0;
    background: $color-surface-2;
    color: $color-muted;
    font-variant-numeric: tabular-nums;
    @include anim(background-color);
    transition-property: background-color, color;

    &--done {
      background: $color-meadow-dim;
      color: color-mix(in srgb, $color-meadow 60%, $color-text);
    }
  }


  &__subs {
    padding: 12px 14px;
    background: $color-sun-dim;
    border-radius: $radius;
  }
  &__sub {
    font-size: 14px;
    line-height: 1.4;
    color: $color-text;
    & + & {
      margin-top: 4px;
    }
  }
  &__sub-marker {
    font-weight: 800;
    color: color-mix(in srgb, $color-sun 45%, $color-text);
  }

  &__steps {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px;
    background: $color-surface-2;
    border-radius: $radius;
  }
  &__info-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: $color-muted;
    b {
      color: $color-text;
    }
    &--top {
      align-items: flex-start;
    }
    > svg {
      flex: 0 0 auto;
    }
  }
  &__storage {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}

// Группа ингредиентов: строки идут плотно, пунктир — только между группами.
.ing-group {
  display: flex;
  flex-direction: column;

  & + & {
    margin-top: 8px;
  }

  &__divider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
    color: color-mix(in srgb, $color-peach 70%, $color-text);
    font-size: 12px;
    font-weight: 700;

    // Пунктир слева и справа от названия (или сплошной, если названия нет).
    &::before,
    &::after {
      content: '';
      flex: 1;
      border-top: 1.5px dashed $color-peach;
    }
    &--plain {
      margin: 2px 0 6px;
      &::after {
        display: none;
      }
    }
  }
  &__title {
    flex: 0 1 auto;
    max-width: 70%;
    text-align: center;
  }

  &__list {
    list-style: none;
  }
}

// Строка ингредиента в одну линию: «195 г молоко кокосовое».
.ing__amount {
  margin-right: 4px;
  color: $color-muted;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 8px;
  margin: 0 -8px;
  width: calc(100% + 16px);
  border-radius: $radius;
  text-align: left;
  line-height: 1.5;
  -webkit-tap-highlight-color: transparent;
  @include anim(background-color);

  &:hover {
    background: $color-surface-2;
  }

  &__num {
    flex: 0 0 auto;
    width: 26px;
    height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-pill;
    background: $color-accent-dim;
    color: color-mix(in srgb, $color-accent 70%, $color-text);
    font-weight: 800;
    font-size: 13px;
    @include anim(background-color);
    transition-property: background-color, color;
  }
  &__text {
    flex: 1;
    @include anim(color);
  }

  &--done {
    .step__num {
      background: $color-success;
      color: #fff;
    }
    .step__text {
      color: $color-muted;
    }
  }
}

.kbju {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;

  &__cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 4px;
    border-radius: $radius-sm;
    background: $color-surface;
  }
  &__value {
    font-weight: 800;
    font-size: 16px;
    color: $color-heading;
    font-variant-numeric: tabular-nums;
  }
  &__label {
    font-size: 11px;
    color: $color-muted;
  }
}
</style>
