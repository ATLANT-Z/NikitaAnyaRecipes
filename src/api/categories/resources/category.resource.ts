// DTO категории. Источник истины контракта с Supabase (таблица `categories`).
export interface CategoryDto {
  id: string
  slug: string
  title: string
  sort_order: number
}
