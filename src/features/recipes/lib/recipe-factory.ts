import { v4 as uuid } from 'uuid'
import type {
  IngredientDto,
  RecipeDto,
  RecipeImageDto,
  SectionDto,
  StorageDto,
  SubstitutionDto,
} from '@/api/recipes/resources/recipe.resource'
import { toRaw } from 'vue'

// Фабрики пустых сущностей для редактора. id генерим через uuid (не randomUUID).
export class RecipeFactory {
  static ingredient(): IngredientDto {
    return { id: uuid(), amount: '', name: '' }
  }
  static substitution(): SubstitutionDto {
    return { id: uuid(), marker: '*', text: '' }
  }
  static storage(): StorageDto {
    return { id: uuid(), place: '', duration: '' }
  }
  static section(sortOrder: number): SectionDto {
    return {
      id: uuid(),
      title: '',
      sort_order: sortOrder,
      servings: '',
      cost: null,
      kbju: null, // КБЖУ — по желанию, добавляется в редакторе
      ingredients: [RecipeFactory.ingredient()],
      substitutions: [],
      steps: [''],
      storage: [],
    }
  }

  // Пустой КБЖУ — когда пользователь решил его заполнить.
  static kbju(): NonNullable<SectionDto['kbju']> {
    return { cal: 0, prot: 0, fat: 0, carb: 0 }
  }
  static image(url: string): RecipeImageDto {
    return { id: uuid(), url }
  }
  static recipe(categorySlug: string): RecipeDto {
    return {
      id: uuid(),
      title: '',
      category_slug: categorySlug,
      cover_url: null,
      images: [],
      time_minutes: 30,
      sections: [RecipeFactory.section(1)],
    }
  }

  // Глубокая копия — редактор правит черновик, не трогая кэш до сохранения.
  static clone(recipe: RecipeDto): RecipeDto {
    return structuredClone(toRaw(recipe))
  }
}
