import { fileURLToPath, URL } from 'node:url'
import process from 'node:process'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'

// GitHub Pages живёт под /<repo>/. В CI берём имя репозитория из
// GITHUB_REPOSITORY (owner/repo) — переименуют репу, base подхватится сам.
// Локально и в дев-режиме — корень '/'. Переопределить можно через BASE_PATH.
const ghRepo = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = process.env.BASE_PATH ?? (process.env.GITHUB_ACTIONS && ghRepo ? `/${ghRepo}/` : '/')

// SPA. Максимум логики на фронте; бэк — Supabase.
export default defineConfig({
  base,
  // PORT задаёт окружение (превью-раннер); иначе дефолт vite.
  server: { port: Number(process.env.PORT) || 5173 },
  plugins: [vue(), svgLoader()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        // Глобальный preload: переменные, миксины и общее из style.scss
        // доступны в любом <style lang="scss"> без ручного @use.
        additionalData: '@use "@/assets/scss/style" as *;',
      },
    },
  },
})
