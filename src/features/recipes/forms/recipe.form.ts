import { z } from 'zod'

// Валидация рецепта на сабмите (safeParse). Для динамического редактора это
// проще и надёжнее, чем per-field vee-validate по 5 уровням вложенности
// (осознанное упрощение — см. docs/tech-debt.md).
const ingredient = z.object({
  id: z.string(),
  amount: z.string(),
  name: z.string().min(1, 'Впишите ингредиент или удалите строку'),
})

const section = z.object({
  id: z.string(),
  title: z.string(), // необязательно: пустое — секция без заголовка
  sort_order: z.number(),
  servings: z.string().nullable(),
  cost: z.number().nullable(),
  kbju: z
    .object({
      cal: z.number(),
      prot: z.number(),
      fat: z.number(),
      carb: z.number(),
    })
    .nullable(),
  ingredients: z.array(ingredient).min(1, 'Добавьте хотя бы один ингредиент'),
  substitutions: z.array(z.object({ id: z.string(), marker: z.string(), text: z.string() })),
  steps: z.array(z.string()),
  storage: z.array(z.object({ id: z.string(), place: z.string(), duration: z.string() })),
})

export const RecipeSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Впишите название рецепта'),
  category_slug: z.string().min(1, 'Выберите категорию'),
  cover_url: z.string().nullable(),
  images: z.array(z.object({ id: z.string(), url: z.string() })),
  time_minutes: z.number().min(1, 'Укажите время приготовления'),
  sections: z.array(section).min(1, 'Добавьте хотя бы одну секцию'),
})

// Первое человекочитаемое сообщение об ошибке (для тоста).
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Проверьте заполнение рецепта'
}
