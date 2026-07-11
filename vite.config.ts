import { fileURLToPath, URL } from 'node:url'
import process from 'node:process'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'

// SPA. Максимум логики на фронте; бэк — Supabase.
export default defineConfig({
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
