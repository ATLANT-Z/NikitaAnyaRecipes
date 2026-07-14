import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/features/auth/model/auth.store'

// Роуты. Страницы тонкие, данные тянут через api/vue-query.
// requiresAdmin — редактирование доступно только вошедшим админам.
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/HomePage.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
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
    meta: { requiresAdmin: true },
  },
  {
    path: '/edit/:id',
    name: 'recipe-edit',
    component: () => import('@/pages/RecipeEditor.vue'),
    meta: { requiresAdmin: true },
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// Гард на редактирование: не админ — отправляем на вход (с возвратом назад).
router.beforeEach((to) => {
  if (!to.meta.requiresAdmin) return true
  const auth = useAuthStore()
  if (auth.isAdmin) return true
  return { name: 'login', query: { redirect: to.fullPath } }
})
