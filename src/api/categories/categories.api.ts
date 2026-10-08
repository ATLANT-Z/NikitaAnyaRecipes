import BaseApi from '@/_shared/api/base.api'
import { ErrorHelper, SE } from '@/_shared/api/errors'
import type { CategoryDto } from './resources/category.resource'

export class CategoriesApi extends BaseApi {
  async list(): Promise<CategoryDto[]> {
    const res = await this.sb
      .from('categories')
      .select('id, slug, title, sort_order, image_url')
      .order('sort_order')
    return BaseApi.unwrap(res)
  }

  // Запись категорий — через Edge Function с проверкой админа по JWT.
  async upsert(category: CategoryDto): Promise<CategoryDto> {
    return this._fn<CategoryDto>('category-upsert', { category }).catch(
      ErrorHelper.map(
        SE._401('Нужно войти как админ'),
        SE._403('Недостаточно прав'),
        SE._409('Категория с таким адресом уже есть'),
        SE._422('Проверьте заполнение категории'),
      ),
    )
  }

  async remove(slug: string): Promise<void> {
    await this._fn('category-delete', { slug }).catch(
      ErrorHelper.map(
        SE._401('Нужно войти как админ'),
        SE._403('Недостаточно прав'),
        SE._409('В категории есть рецепты — сначала перенесите или удалите их'),
      ),
    )
  }

  // Картинка категории — та же Edge Function, что и для обложек блюд.
  async uploadImage(payload: {
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
