import { API } from '@/api/api'
import { isSupabaseConfigured } from '@/_shared/supabase/isConfigured'

// Избранное общее. Без Supabase — держим в localStorage (docs/tech-debt.md #1),
// с ключами — в таблице `favorites`. Наружу одинаковый контракт: список id + тоггл.
const LS_KEY = 'recipes.favorites'

function readLocal(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}
function writeLocal(ids: string[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(ids))
}

class FavoritesRepository {
  private api = API.Favorites

  async list(): Promise<string[]> {
    if (!isSupabaseConfigured) return readLocal()
    return this.api.list()
  }

  async setFavorite(recipeId: string, isFavorite: boolean): Promise<void> {
    if (!isSupabaseConfigured) {
      const set = new Set(readLocal())
      if (isFavorite) set.add(recipeId)
      else set.delete(recipeId)
      writeLocal([...set])
      return
    }
    if (isFavorite) await this.api.add(recipeId)
    else await this.api.remove(recipeId)
  }
}

export const favoritesRepository = new FavoritesRepository()
