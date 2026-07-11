import BaseApi from '@/_shared/api/base.api'
import type { CategoryDto } from './resources/category.resource'

export class CategoriesApi extends BaseApi {
  async list(): Promise<CategoryDto[]> {
    const res = await this.sb
      .from('categories')
      .select('id, slug, title, sort_order')
      .order('sort_order')
    return BaseApi.unwrap(res)
  }
}
