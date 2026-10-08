import { v4 as uuid } from 'uuid'
import { API } from '@/api/api'
import type { CategoryDto } from '@/api/categories/resources/category.resource'
import { AppError } from '@/_shared/api/errors'
import { isSupabaseConfigured } from '@/_shared/supabase/isConfigured'
import { CATEGORIES_FIXTURE, RECIPES_FIXTURE } from '@/_shared/mock/fixtures'
import { FileHelper } from '@/services/helpers/file.helper'
import { SlugHelper } from '@/services/helpers/slug.helper'

// Тонкий фасад над api. Пока нет Supabase — отдаёт фикстуры (docs/tech-debt.md #1).
class CategoriesRepository {
  private api = API.Categories

  async list(): Promise<CategoryDto[]> {
    if (!isSupabaseConfigured) {
      return [...CATEGORIES_FIXTURE].sort((a, b) => a.sort_order - b.sort_order)
    }
    return this.api.list()
  }

  async save(category: CategoryDto): Promise<CategoryDto> {
    if (!isSupabaseConfigured) {
      const idx = CATEGORIES_FIXTURE.findIndex((c) => c.id === category.id)
      if (idx >= 0) {
        // slug существующей не меняем — как на сервере.
        CATEGORIES_FIXTURE[idx] = { ...category, slug: CATEGORIES_FIXTURE[idx].slug }
        return CATEGORIES_FIXTURE[idx]
      }
      const created = {
        ...category,
        slug: SlugHelper.unique(category.slug, CATEGORIES_FIXTURE.map((c) => c.slug)),
      }
      CATEGORIES_FIXTURE.push(created)
      return created
    }
    return this.api.upsert(category)
  }

  async remove(slug: string): Promise<void> {
    if (!isSupabaseConfigured) {
      if (RECIPES_FIXTURE.some((r) => r.category_slug === slug)) {
        throw new AppError(409, 'В категории есть рецепты — сначала перенесите или удалите их')
      }
      const idx = CATEGORIES_FIXTURE.findIndex((c) => c.slug === slug)
      if (idx >= 0) CATEGORIES_FIXTURE.splice(idx, 1)
      return
    }
    return this.api.remove(slug)
  }

  // Картинка категории → публичный URL (кладём в image_url).
  // Папка по id — он есть и у новой категории, у которой slug ещё не выведен.
  async uploadImage(categoryId: string, file: File): Promise<string> {
    if (!isSupabaseConfigured) return URL.createObjectURL(file)
    if (file.size > FileHelper.MAX_IMAGE_BYTES) {
      throw new AppError(413, 'Файл слишком большой (до 5 МБ)')
    }
    const dataBase64 = await FileHelper.toBase64(file)
    const path = `categories/${categoryId}/${uuid()}.${FileHelper.ext(file)}`
    return this.api.uploadImage({ path, contentType: file.type, dataBase64 })
  }
}

export const categoriesRepository = new CategoriesRepository()
