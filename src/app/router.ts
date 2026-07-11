import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

// Роуты. Страницы тонкие, данные тянут через api/vue-query.
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/HomePage.vue'),
  },
  {
    path: '/c/:slug',
    name: 'category',
    component: () => import('@/pages/CategoryPage.vue'),
    props: true,
  },
  {
    path: '/r/:id',
    name: 'recipe',
    component: () => import('@/pages/RecipePage.vue'),
    props: true,
  },
  {
    path: '/new',
    name: 'recipe-new',
    component: () => import('@/pages/RecipeEditor.vue'),
  },
  {
    path: '/edit/:id',
    name: 'recipe-edit',
    component: () => import('@/pages/RecipeEditor.vue'),
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
