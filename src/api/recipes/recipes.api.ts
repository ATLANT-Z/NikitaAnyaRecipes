import BaseApi from '@/_shared/api/base.api'
import { ErrorHelper, SE } from '@/_shared/api/errors'
import type { RecipeCardDto, RecipeDto } from './resources/recipe.resource'

// Секции хранятся денормализованно (jsonb-массивы внутри recipe_sections),
// поэтому один вложенный select возвращает уже готовый DTO. См. docs/tech-debt.md.
const RECIPE_SELECT = `
  id, title, category_slug, cover_url, time_minutes,
  sections:recipe_sections(
    id, title, sort_order, servings, cost, kbju,
    ingredients, substitutions, steps, storage
  )
` as const

const CARD_SELECT = 'id, title, category_slug, cover_url' as const

export class RecipesApi extends BaseApi {
  async listByCategory(slug: string): Promise<RecipeCardDto[]> {
    const res = await this.sb
      .from('recipes')
      .select(CARD_SELECT)
      .eq('category_slug', slug)
      .order('created_at', { ascending: false })
    return BaseApi.unwrap(res)
  }

  async search(query: string): Promise<RecipeCardDto[]> {
    const res = await this.sb
      .from('recipes')
      .select(CARD_SELECT)
      .ilike('title', `%${query}%`)
      .limit(50)
    return BaseApi.unwrap(res)
  }

  async get(id: string): Promise<RecipeDto> {
    const res = await this.sb.from('recipes').select(RECIPE_SELECT).eq('id', id).single()

    if (res.error) {
      return ErrorHelper.map(SE._404('Рецепт не найден'))({
        status: 404,
        message: res.error.message,
      })
    }
    // Секции упорядочиваем по sort_order (jsonb-массивы внутри уже в порядке ввода).
    const recipe = res.data as unknown as RecipeDto
    recipe.sections = [...recipe.sections].sort((a, b) => a.sort_order - b.sort_order)
    return recipe
  }

  // Запись — через Edge Function с проверкой админа по JWT сессии (email-вход).
  async upsert(recipe: RecipeDto): Promise<RecipeDto> {
    return this._fn<RecipeDto>('recipe-upsert', { recipe }).catch(
      ErrorHelper.map(
        SE._401('Нужно войти как админ'),
        SE._403('Недостаточно прав'),
        SE._422('Проверьте заполнение рецепта'),
      ),
    )
  }

  async remove(id: string): Promise<void> {
    await this._fn('recipe-delete', { id }).catch(
      ErrorHelper.map(SE._401('Нужно войти как админ'), SE._403('Недостаточно прав')),
    )
  }

  // Загрузка обложки — через Edge Function (service_role заливает в Storage).
  async uploadCover(payload: {
    path: string
    contentType: string
    dataBase64: string
  }): Promise<string> {
    const res = await this._fn<{ url: string }>('cover-upload', payload).catch(
      ErrorHelper.map(
        SE._401('Нужно войти как админ'),
        SE._403('Недостаточно прав'),
        SE._413('Файл слишком большой (до 5 МБ)'),
        SE._422('Не удалось обработать изображение'),
      ),
    )
    return res.url
  }
}
