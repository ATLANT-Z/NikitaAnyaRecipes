import type { CategoryDto } from '@/api/categories/resources/category.resource'
import type { RecipeDto } from '@/api/recipes/resources/recipe.resource'

// Локальные фикстуры для разработки без Supabase (см. docs/tech-debt.md #1).
// Вайшнавская кухня: без мяса/рыбы/яиц/лука/чеснока.

export const CATEGORIES_FIXTURE: CategoryDto[] = [
  { id: 'c-soup', slug: 'soup', title: 'Суп', sort_order: 1 },
  { id: 'c-hot', slug: 'hot', title: 'Горячее', sort_order: 2 },
  { id: 'c-salad', slug: 'salad', title: 'Салат', sort_order: 3 },
  { id: 'c-snack', slug: 'snack', title: 'Закуски', sort_order: 4 },
  { id: 'c-dessert', slug: 'dessert', title: 'Десерт', sort_order: 5 },
  { id: 'c-drink', slug: 'drink', title: 'Напиток', sort_order: 6 },
  { id: 'c-baking', slug: 'baking', title: 'Выпечка', sort_order: 7 },
  { id: 'c-cake', slug: 'cake', title: 'Торт', sort_order: 8 },
]

export const RECIPES_FIXTURE: RecipeDto[] = [
  {
    id: 'r-kulich',
    title: 'Кулич',
    category_slug: 'dessert',
    cover_url: null,
    time_minutes: 60,
    sections: [
      {
        id: 's-kulich-dough',
        title: 'Тесто',
        sort_order: 1,
        servings: '1 форма',
        cost: 300,
        kbju: { cal: 320, prot: 8, fat: 10, carb: 50 },
        ingredients: [
          { id: 'i1', amount: '500 г', name: 'мука' },
          { id: 'i2', amount: '100 г', name: 'сливочное масло' },
          { id: 'i3', amount: '150 г', name: 'сметана' },
          { id: 'i4', amount: '200 мл', name: 'молоко' },
          { id: 'i5', amount: '100 г', name: 'изюм' },
          { id: 'i6', amount: '150 г', name: 'сахар' },
        ],
        substitutions: [
          { id: 'sub1', marker: '*', text: 'сметану можно заменить йогуртом' },
          { id: 'sub2', marker: '**', text: 'молоко — на растительное' },
        ],
        steps: [
          'Подогреть молоко, распустить дрожжи с сахаром.',
          'Вмешать муку, масло и сметану, замесить тесто.',
          'Добавить изюм, оставить подходить на час.',
        ],
        storage: [
          { id: 'st1', place: 'В холодильнике', duration: 'до 1 недели' },
          { id: 'st2', place: 'В морозилке', duration: 'до 3 месяцев' },
        ],
      },
      {
        id: 's-kulich-glaze',
        title: 'Глазурь',
        sort_order: 2,
        servings: 'на 1 кулич',
        cost: 80,
        kbju: { cal: 150, prot: 1, fat: 0, carb: 38 },
        ingredients: [
          { id: 'i7', amount: '100 г', name: 'сахарная пудра' },
          { id: 'i8', amount: '2 ст.л.', name: 'лимонный сок' },
          { id: 'i9', amount: 'по вкусу', name: 'кондитерская посыпка' },
        ],
        substitutions: [{ id: 'sub3', marker: '*', text: 'лимонный сок — на воду' }],
        steps: ['Смешать пудру с соком до густоты.', 'Полить остывший кулич, украсить посыпкой.'],
        storage: [{ id: 'st3', place: 'В холодильнике', duration: 'до 5 дней' }],
      },
    ],
  },
  {
    id: 'r-paneer',
    title: 'Панир с овощами',
    category_slug: 'hot',
    cover_url: null,
    time_minutes: 40,
    sections: [
      {
        id: 's-paneer',
        title: 'Основа',
        sort_order: 1,
        servings: '2 порции',
        cost: 250,
        kbju: { cal: 280, prot: 14, fat: 18, carb: 12 },
        ingredients: [
          { id: 'p1', amount: '300 г', name: 'панир' },
          { id: 'p2', amount: '1 шт', name: 'болгарский перец' },
          { id: 'p3', amount: '200 г', name: 'томаты' },
          { id: 'p4', amount: '1 ч.л.', name: 'куркума' },
          { id: 'p5', amount: 'щепотка', name: 'асафетида' },
        ],
        substitutions: [{ id: 'ps1', marker: '*', text: 'панир — на тофу' }],
        steps: [
          'Обжарить панир до румяности, отложить.',
          'Потушить перец и томаты со специями.',
          'Вернуть панир, прогреть 5 минут.',
        ],
        storage: [{ id: 'pst1', place: 'В холодильнике', duration: 'до 2 дней' }],
      },
    ],
  },
  {
    id: 'r-lassi',
    title: 'Манговый ласси',
    category_slug: 'drink',
    cover_url: null,
    time_minutes: 10,
    sections: [
      {
        id: 's-lassi',
        title: 'Напиток',
        sort_order: 1,
        servings: '2 стакана',
        cost: 150,
        kbju: { cal: 180, prot: 5, fat: 4, carb: 30 },
        ingredients: [
          { id: 'l1', amount: '200 г', name: 'мякоть манго' },
          { id: 'l2', amount: '300 мл', name: 'йогурт' },
          { id: 'l3', amount: '2 ст.л.', name: 'мёд' },
          { id: 'l4', amount: 'щепотка', name: 'кардамон' },
        ],
        substitutions: [{ id: 'ls1', marker: '*', text: 'мёд — на сахар' }],
        steps: ['Взбить все ингредиенты в блендере.', 'Подавать охлаждённым.'],
        storage: [{ id: 'lst1', place: 'В холодильнике', duration: 'до 1 дня' }],
      },
    ],
  },
]
