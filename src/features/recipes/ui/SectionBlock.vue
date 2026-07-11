<script setup lang="ts">
import type { SectionDto } from '@/api/recipes/resources/recipe.resource'
import { NumberHelper } from '@/services/helpers/number.helper'
import AppCheckbox from '@/shared/ui/AppCheckbox.vue'

interface Props {
  section: SectionDto
  isChecked: (id: string) => boolean
  onSet: (id: string, value: boolean) => void
}
defineProps<Props>()
</script>

<template>
  <section class="section">
    <h2 class="section__title">{{ section.title }}</h2>

    <!-- Ингредиенты (чек-лист) -->
    <ul class="section__ingredients">
      <li v-for="ing in section.ingredients" :key="ing.id" class="section__ingredient">
        <AppCheckbox :model-value="isChecked(ing.id)" @update:model-value="onSet(ing.id, $event)">
          <span class="section__amount">{{ ing.amount }}</span>
          {{ ing.name }}
        </AppCheckbox>
      </li>
    </ul>

    <!-- Замены -->
    <div v-if="section.substitutions.length" class="section__subs">
      <p v-for="sub in section.substitutions" :key="sub.id" class="section__sub">
        <span class="section__sub-marker">{{ sub.marker }}</span> {{ sub.text }}
      </p>
    </div>

    <!-- Мета: порция / стоимость / КБЖУ -->
    <dl class="section__meta">
      <div v-if="section.servings" class="section__meta-row">
        <dt>Порция</dt>
        <dd>{{ section.servings }}</dd>
      </div>
      <div v-if="section.cost != null" class="section__meta-row">
        <dt>Стоимость</dt>
        <dd>{{ NumberHelper.money(section.cost) }}</dd>
      </div>
      <div v-if="section.kbju" class="section__meta-row">
        <dt>КБЖУ</dt>
        <dd>
          {{ section.kbju.cal }} · {{ section.kbju.prot }} · {{ section.kbju.fat }} ·
          {{ section.kbju.carb }}
        </dd>
      </div>
    </dl>

    <!-- Шаги -->
    <ol v-if="section.steps.length" class="section__steps">
      <li v-for="(step, i) in section.steps" :key="i" class="section__step">
        <span class="section__step-num">{{ i + 1 }}</span>
        <span>{{ step }}</span>
      </li>
    </ol>

    <!-- Хранение -->
    <div v-if="section.storage.length" class="section__storage">
      <p v-for="s in section.storage" :key="s.id" class="section__storage-row">
        {{ s.place }} — <b>{{ s.duration }}</b>
      </p>
    </div>
  </section>
</template>

<style scoped lang="scss">
.section {
  @include card($radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__title {
    font-size: 20px;
    text-align: center;
  }

  &__ingredients {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  &__amount {
    display: inline-block;
    min-width: 56px;
    color: $color-muted;
    font-weight: 700;
  }

  &__subs {
    padding: 12px 14px;
    background: $color-sun-dim;
    border-radius: $radius;
  }
  &__sub {
    font-size: 14px;
    color: $color-text;
    & + & {
      margin-top: 4px;
    }
  }
  &__sub-marker {
    font-weight: 800;
    color: color-mix(in srgb, $color-sun 45%, $color-text);
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 14px;
    background: $color-surface-2;
    border-radius: $radius;
  }
  &__meta-row {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    dt {
      color: $color-muted;
    }
    dd {
      font-weight: 700;
    }
  }

  &__steps {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  &__step {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    line-height: 1.45;
  }
  &__step-num {
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
  }

  &__storage {
    font-size: 14px;
    color: $color-muted;
    &-row + &-row {
      margin-top: 4px;
    }
    b {
      color: $color-text;
    }
  }
}
</style>
