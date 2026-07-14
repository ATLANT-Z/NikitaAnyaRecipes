import { CategoriesApi } from './categories/categories.api'
import { RecipesApi } from './recipes/recipes.api'
import { FavoritesApi } from './favorites/favorites.api'

// Оглавление api-слоя: единая точка доступа ко всем фичам-эндпоинтам.
// Использование: API.Recipes.get(id), API.Categories.list(), ...
class Api {
  Categories = new CategoriesApi()
  Recipes = new RecipesApi()
  Favorites = new FavoritesApi()
}

export const API = new Api()
