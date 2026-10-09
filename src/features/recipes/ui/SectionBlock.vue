<script setup lang="ts">
import { computed } from 'vue'
import { Check, ChefHat, Coins, Refrigerator, ShoppingBasket } from 'lucide-vue-next'
import type { SectionDto } from '@/api/recipes/resources/recipe.resource'
import { NumberHelper } from '@/services/helpers/number.helper'
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

const checkedCount = computed(
  () => props.section.ingredients.filter((i) => props.isChecked(i.id)).length,
)
const isAllChecked = computed(
  () => props.section.ingredients.length > 0 && checkedCount.value === props.section.ingredients.length,
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
          :aria-label="`Отмечено ${checkedCount} из ${section.ingredients.length}`"
        >
          {{ checkedCount }}/{{ section.ingredients.length }}
        </span>
      </p>
      <ul class="section__ingredients">
        <li v-for="ing in section.ingredients" :key="ing.id">
          <AppCheckbox
            block
            :model-value="isChecked(ing.id)"
            @update:model-value="onSet(ing.id, $event)"
          >
            <span class="ing">
              <span class="ing__amount">{{ ing.amount }}</span>
              <span class="ing__name">{{ ing.name }}</span>
            </span>
          </AppCheckbox>
        </li>
      </ul>

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

  &__ingredients {
    list-style: none;
    display: flex;
    flex-direction: column;

    li + li {
      border-top: 1px dashed $color-border;
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

// Строка ингредиента: количество — ровной колонкой слева, затем название.
.ing {
  display: flex;
  align-items: baseline;
  gap: 10px;

  &__amount {
    flex: 0 0 auto;
    min-width: 72px;
    max-width: 40%;
    color: $color-muted;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  &__name {
    flex: 1;
    min-width: 0;
  }
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
