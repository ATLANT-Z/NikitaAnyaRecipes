import { API } from '@/api/api'
import type { CategoryDto } from '@/api/categories/resources/category.resource'
import { isSupabaseConfigured } from '@/_shared/supabase/isConfigured'
import { CATEGORIES_FIXTURE } from '@/_shared/mock/fixtures'

// Тонкий фасад над api. Пока нет Supabase — отдаёт фикстуры (docs/tech-debt.md #1).
class CategoriesRepository {
  private api = API.Categories

  async list(): Promise<CategoryDto[]> {
    if (!isSupabaseConfigured) return CATEGORIES_FIXTURE
    return this.api.list()
  }
}

export const categoriesRepository = new CategoriesRepository()
