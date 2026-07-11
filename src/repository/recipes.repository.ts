import { v4 as uuid } from 'uuid'
import { API } from '@/api/api'
import type { RecipeCardDto, RecipeDto } from '@/api/recipes/resources/recipe.resource'
import { AppError } from '@/_shared/api/errors'
import { isSupabaseConfigured } from '@/_shared/supabase/isConfigured'
import { RECIPES_FIXTURE } from '@/_shared/mock/fixtures'
import { FileHelper } from '@/services/helpers/file.helper'

function toCard(r: RecipeDto): RecipeCardDto {
  return { id: r.id, title: r.title, category_slug: r.category_slug, cover_url: r.cover_url }
}

class RecipesRepository {
  private api = API.Recipes

  async listByCategory(slug: string): Promise<RecipeCardDto[]> {
    if (!isSupabaseConfigured) {
      return RECIPES_FIXTURE.filter((r) => r.category_slug === slug).map(toCard)
    }
    return this.api.listByCategory(slug)
  }

  async search(query: string): Promise<RecipeCardDto[]> {
    const q = query.trim().toLowerCase()
    if (!q) return []
    if (!isSupabaseConfigured) {
      return RECIPES_FIXTURE.filter((r) => r.title.toLowerCase().includes(q)).map(toCard)
    }
    return this.api.search(q)
  }

  async get(id: string): Promise<RecipeDto> {
    if (!isSupabaseConfigured) {
      const found = RECIPES_FIXTURE.find((r) => r.id === id)
      if (!found) throw new AppError(404, 'Рецепт не найден')
      return found
    }
    return this.api.get(id)
  }

  async save(recipe: RecipeDto): Promise<RecipeDto> {
    if (!isSupabaseConfigured) {
      // Локальная запись в фикстуры — чтобы правки были видны в рамках сессии.
      const idx = RECIPES_FIXTURE.findIndex((r) => r.id === recipe.id)
      if (idx >= 0) RECIPES_FIXTURE[idx] = recipe
      else RECIPES_FIXTURE.push(recipe)
      return recipe
    }
    return this.api.upsert(recipe)
  }

  async remove(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const idx = RECIPES_FIXTURE.findIndex((r) => r.id === id)
      if (idx >= 0) RECIPES_FIXTURE.splice(idx, 1)
      return
    }
    return this.api.remove(id)
  }

  // Заливает обложку и возвращает URL для сохранения в cover_url.
  async uploadCover(recipeId: string, file: File): Promise<string> {
    if (!isSupabaseConfigured) {
      // Без бэкенда — локальный предпросмотр в рамках сессии.
      return URL.createObjectURL(file)
    }
    if (file.size > FileHelper.MAX_IMAGE_BYTES) {
      throw new AppError(413, 'Файл слишком большой (до 5 МБ)')
    }
    const dataBase64 = await FileHelper.toBase64(file)
    const path = `${recipeId}/${uuid()}.${FileHelper.ext(file)}`
    return this.api.uploadCover({ path, contentType: file.type, dataBase64 })
  }
}

export const recipesRepository = new RecipesRepository()
