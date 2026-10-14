import type { IngredientDto } from '@/api/recipes/resources/recipe.resource'

// Группы ингредиентов хранятся плоско: заголовок (is_group) + строки после него.
// Так не нужна миграция БД, а старые рецепты — одна группа без заголовка.

export interface IngredientRow {
  ing: IngredientDto
  index: number // позиция в плоском массиве секции
}

export interface IngredientGroup {
  key: string
  header: IngredientDto | null
  headerIndex: number // -1 — группа без заголовка (ведущие строки)
  items: IngredientRow[]
  end: number // куда вставлять новую строку этой группы
}

export class IngredientGroups {
  static split(list: IngredientDto[]): IngredientGroup[] {
    const groups: IngredientGroup[] = []
    let current: IngredientGroup | null = null

    list.forEach((ing, index) => {
      if (ing.is_group) {
        current = { key: ing.id, header: ing, headerIndex: index, items: [], end: index + 1 }
        groups.push(current)
        return
      }
      if (!current) {
        current = { key: 'lead', header: null, headerIndex: -1, items: [], end: 0 }
        groups.push(current)
      }
      current.items.push({ ing, index })
      current.end = index + 1
    })

    return groups
  }

  // Только настоящие ингредиенты (без заголовков групп).
  static items(list: IngredientDto[]): IngredientDto[] {
    return list.filter((i) => !i.is_group)
  }

  // Перед сохранением: убираем пустые строки и пустые группы; единственной
  // группе без названия заголовок не нужен.
  static clean(list: IngredientDto[]): IngredientDto[] {
    const groups = IngredientGroups.split(list)
      .map((g) => ({
        title: g.header?.name.trim() ?? '',
        header: g.header,
        items: g.items.map((r) => r.ing).filter((i) => i.name.trim()),
      }))
      .filter((g) => g.items.length)

    const isSingleUntitled = groups.length === 1 && !groups[0].title
    return groups.flatMap((g) => {
      const header = g.header && !isSingleUntitled ? [{ ...g.header, name: g.title }] : []
      return [...header, ...g.items]
    })
  }
}
