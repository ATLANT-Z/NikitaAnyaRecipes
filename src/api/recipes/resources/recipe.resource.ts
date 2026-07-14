// DTO рецепта. Секции («составные ингредиенты», напр. Тесто/Крем) самодостаточны:
// у каждой свои ингредиенты, замены, мета (порция/стоимость/КБЖУ), шаги и хранение
// — так устроен дизайн экрана рецепта.

export interface KbjuDto {
  cal: number // калории
  prot: number // белки
  fat: number // жиры
  carb: number // углеводы
}

export interface IngredientDto {
  id: string
  amount: string // «44», «1», «по вкусу»
  name: string
}

export interface SubstitutionDto {
  id: string
  marker: string // «*», «**»
  text: string
}

export interface StorageDto {
  id: string
  place: string // «В холодильнике», «В морозилке»
  duration: string // «до 1 месяца»
}

export interface SectionDto {
  id: string
  title: string
  sort_order: number
  servings: string | null // «x г»
  cost: number | null // ₽
  kbju: KbjuDto | null
  ingredients: IngredientDto[]
  substitutions: SubstitutionDto[]
  steps: string[] // по порядку
  storage: StorageDto[]
}

// Карточка рецепта (список/сетка).
export interface RecipeCardDto {
  id: string
  title: string
  category_slug: string
  cover_url: string | null
}

// Обложка для мозаики плитки категории — лёгкая выборка (только с фото).
export interface RecipeCoverDto {
  id: string
  category_slug: string
  cover_url: string
}

// Полный рецепт (экран рецепта).
export interface RecipeDto extends RecipeCardDto {
  time_minutes: number
  sections: SectionDto[]
}
