import { useStorage } from '@vueuse/core'

// Галочки в чек-листе ингредиентов — помощник при готовке, не серверные данные.
// Храним в localStorage по рецепту: закрыл/открыл экран — отметки на месте.
export function useIngredientChecks(recipeId: string) {
  const checked = useStorage<string[]>(`recipe.checks.${recipeId}`, [])

  const isChecked = (id: string) => checked.value.includes(id)

  function set(id: string, value: boolean) {
    const has = checked.value.includes(id)
    if (value && !has) checked.value = [...checked.value, id]
    else if (!value && has) checked.value = checked.value.filter((x) => x !== id)
  }

  function reset() {
    checked.value = []
  }

  return { isChecked, set, reset }
}
