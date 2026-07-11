import BaseApi from '@/_shared/api/base.api'

// Избранное — общее на всех (таблица `favorites`, одна строка = один рецепт).
// Тоггл открыт для всех по RLS (семейное приложение); при желании закроем позже.
export class FavoritesApi extends BaseApi {
  async list(): Promise<string[]> {
    const res = await this.sb.from('favorites').select('recipe_id')
    const rows = BaseApi.unwrap<{ recipe_id: string }[]>(res)
    return rows.map((r) => r.recipe_id)
  }

  async add(recipeId: string): Promise<void> {
    const { error } = await this.sb.from('favorites').insert({ recipe_id: recipeId })
    if (error) throw error
  }

  async remove(recipeId: string): Promise<void> {
    const { error } = await this.sb.from('favorites').delete().eq('recipe_id', recipeId)
    if (error) throw error
  }
}
