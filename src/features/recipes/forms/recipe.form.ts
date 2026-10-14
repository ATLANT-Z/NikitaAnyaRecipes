import { z } from 'zod'

// Валидация рецепта на сабмите (safeParse). Для динамического редактора это
// проще и надёжнее, чем per-field vee-validate по 5 уровням вложенности
// (осознанное упрощение — см. docs/tech-debt.md).
const ingredient = z.object({
  id: z.string(),
  amount: z.string(),
  name: z.string(),
  is_group: z.boolean().optional(), // заголовок группы — название не обязательно
})

// Пустое название — ошибка только у ингредиента (не у заголовка группы);
// нужен хотя бы один настоящий ингредиент.
const ingredients = z.array(ingredient).superRefine((list, ctx) => {
  list.forEach((it, i) => {
    if (!it.is_group && !it.name.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [i, 'name'],
        message: 'Впишите ингредиент или удалите строку',
      })
    }
  })
  if (!list.some((it) => !it.is_group)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Добавьте хотя бы один ингредиент' })
  }
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
  ingredients,
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
