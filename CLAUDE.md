# Рецепты — свод правил фронта

Подарочное приложение рецептов (вайшнавская кухня). Мобайл-фёрст, работает как сайт **и** как Telegram Mini App. Личное/семейное использование.

## Стек

Vue 3.5 (`<script setup>`, Composition API) · TypeScript строго (`strict`, без `any` где возможно) · Vite (SPA) · vue-router · Pinia (setup-stores) · `@tanstack/vue-query` · vee-validate + zod · `@vueuse/core` · reka-ui (a11y-примитивы) · `@supabase/supabase-js` · vue-sonner (тосты) · lucide-vue-next (иконки) · SCSS/BEM. FSD.

**Бэкенд — Supabase** (Postgres + Storage + Edge Functions). Своего сервера нет. Laravel/Inertia из референс-проекта rockwheel НЕ используем — оттуда взята только фронт-архитектура.

## Архитектура и слои

Гибрид: централизованный `api/` (контракт с бэком) + FSD-light.

```
src/
├── app/         роутер, vue-query, провайдеры
├── api/         BaseApi + <feature>/*.api.ts + resources/ (DTO)
├── repository/  тонкие классы-фасады (маппинг DTO→Model, если нужен)
├── features/    <feature>/{ model/ ui/ forms/ helpers/ lib/ }
├── pages/       тонкие страницы-роуты
├── services/    modal.service.ts, helpers/ (NumberHelper, TimeHelper)
├── shared/      app-aware общее (layout, декор, UI этого проекта)
├── _shared/     агностик-ядро (api, telegram, modals, composables, helpers, plugins, stores)
└── assets/scss/ common/_variables (Ghibli), _mixins; style.scss (preload), index.scss (резеты)
```

Зависимости строго вниз: `features → shared → _shared`. Никогда вверх.

## API слой (адаптация под Supabase)

- Каждый api-класс наследует `BaseApi` (`_shared/api/base.api.ts`), регистрируется в `api/api.ts`.
- **Чтение** — через `this.sb.from(...).select()`, снятие через `BaseApi.unwrap()`.
- **Запись** — только через `this._fn('edge-function', body)`: Edge Function проверяет Telegram initData + права админа. `service_role` живёт на сервере.
- 4xx → `ErrorHelper.map(SE._4xx('текст'))` → типизированный `AppError` с человеческим сообщением.
- DTO — в `api/<feature>/resources/*.resource.ts`. Enum — `*.enum.ts`.

## Store / State — «one-shot»

- Pinia setup-stores + vue-query. Дефолт (задан глобально в `app/query.ts`): `staleTime: Infinity`, без refetch по focus/reconnect/mount. Обновление — только руками (`invalidateQueries` после мутации). **Бережём лимиты Supabase.**
- Return группируем в namespace-объекты: `{ data, filters, actions, refetch }`.
- `isPending` мутаций — оборачиваем в `computed`, не отдаём ref напрямую.
- Async-значения — `T | null` (не EMPTY-объекты), в UI `v-if + skeleton`.

## Формы

- `useMyForm(Schema, {...})` + zod. Схема — `FormHelper.createSchema<T>()(shape)` (плоский `ZodObject`).
- Cross-field правила — через `extendValidation`, НЕ `z.object().refine()` напрямую.
- Поля — через form-inputs/`SmartField`, никогда сырой `<input v-model>`.
- Submit живёт внутри компонента-владельца формы; наружу валидные значения не эмитим.

## Модалки — своя система

- Реестр в `services/modal.service.ts` через `ModalsHelper.reg<TResult>(Component)`.
- ОДИН компонент = ОДИН ключ (разница поведения — через props).
- Открытие: `useModals().show('key', { props }).wait` → `Promise<TResult>`.
- Внутри: `const { resolve, close, props, notifications } = useModal('key')`.
- Каркас — `ModalCard`, кнопки — `ModalBtn`. reka-ui Dialog как корень НЕ используем.

## Стили (SCSS / BEM)

- `<style scoped lang="scss">` в каждом компоненте. БЕМ: `.block__element--modifier`, без глубокой вложенности.
- Переменные/миксины доступны везде автоматически (vite `additionalData` → `style.scss`). Руками `@use` не писать.
- Цвета — ТОЛЬКО из `_variables.scss` (Ghibli-палитра). Нужного нет — расширяем палитру.
- Крупные картинки = `div` с фоном-заглушкой и рабочим классом (лёгкая замена на `<img>`). SVG — только мелкий декор/градиенты/блобы/анимируемое.

## Хелперы

- Хелпер = класс со `static`-методами (`NumberHelper`, `TimeHelper`, `TelegramHelper`). Без функций-россыпью, без инстансов.

## Типизация

- `strict`, `any` минимально (только в generic-инфре модалок — документированный паттерн). `unknown` → type guard.
- Булевы всегда с `is`: `isLoading`, `isEditing`.
- `as const satisfies Record<...>` для «значение-как-тип».

## Telegram / админ

- `TelegramHelper` — обёртка над Telegram WebApp. `isTelegram` = есть подписанный `initData`.
- Редактирование (карандаш) доступно **только внутри Telegram** и только админам (таблица `admins`). Обычный сайт — read-only.
- Аня становится админом командой боту `/me_admin {key}` (Edge Function сверяет ключ).

## Команды

```bash
npm run dev         # дев-сервер
npm run typecheck   # vue-tsc --noEmit — гейт
npm run build       # typecheck + сборка
npm run lint
```

## Чего НЕ делать

- ❌ `crypto.randomUUID()` → ✅ `uuid` (`v4`).
- ❌ Глобальный QueryClient-оверрайд по месту → ✅ дефолты в `app/query.ts`, точечно в `useQuery`.
- ❌ Ручной `@use '.../common'` в компонентах → ✅ preload через vite.
- ❌ Сырой `<input v-model>` в формах → ✅ form-inputs/SmartField.
- ❌ Запись в БД напрямую с фронта → ✅ через Edge Function с проверкой админа.
- ❌ Намёки на мясо/рыбу/яйца/лук/чеснок в контенте и декоре (вайшнавская эстетика).
