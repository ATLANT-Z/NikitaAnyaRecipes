# Рецепты 🌿

Подарочное приложение рецептов (вайшнавская кухня). Мобайл-фёрст, работает как **сайт** и как **Telegram Mini App**. Стиль — Studio Ghibli.

- **Фронт:** Vue 3 + TS + Vite (SPA), SCSS/BEM, FSD. Деплой — Vercel.
- **Бэк:** Supabase (Postgres + Storage + Edge Functions). Своего сервера нет.
- Архитектура и правила — в [CLAUDE.md](CLAUDE.md). Осознанные упрощения — в [docs/tech-debt.md](docs/tech-debt.md).

---

## Локальный запуск

```bash
npm install
npm run dev        # http://localhost:5173
```

Без `.env` приложение работает на **локальных фикстурах** (можно кликать всё уже сейчас).
Чтобы посмотреть режим редактирования без Telegram — открой `http://localhost:5173/?admin=1`
(выключить: `/?admin=0`).

Проверки:

```bash
npm run typecheck  # vue-tsc — гейт типов
npm run build      # прод-сборка
npm run lint
```

---

## Подключение Supabase (по шагам)

> Делается один раз. Дальше приложение само пойдёт в реальную БД вместо фикстур.

### 1. Создать проект

1. Зайди на [supabase.com](https://supabase.com) → **New project**. Запомни пароль БД.
2. После создания открой **Project Settings → API** и скопируй:
   - **Project URL** → это `VITE_SUPABASE_URL`
   - **anon public** ключ → это `VITE_SUPABASE_ANON_KEY`
3. В корне проекта скопируй `.env.example` в `.env` и вставь эти значения.

### 2. Создать таблицы

Вариант простой (без CLI): открой в Supabase **SQL Editor**, вставь содержимое
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), нажми **Run**.
Создадутся таблицы, RLS-политики, бакет для картинок и сид категорий.

### 3. Установить Supabase CLI (для Edge Functions)

```bash
npm i -g supabase
supabase login
supabase link --project-ref <ID-проекта>   # ID виден в URL дашборда
```

### 4. Завести Telegram-бота

1. В Telegram напиши [@BotFather](https://t.me/BotFather) → `/newbot`, следуй шагам.
2. Скопируй **токен** бота (вида `12345:AA...`).
3. Придумай **секретный ключ админа** (любая строка) — по нему Аня станет админом.

### 5. Задать секреты и задеплоить функции

```bash
# SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY Supabase подставляет в функции сам.
supabase secrets set TELEGRAM_BOT_TOKEN=<токен_бота>
supabase secrets set ADMIN_SECRET=<секретный_ключ_админа>

supabase functions deploy bot recipe-upsert recipe-delete verify-admin cover-upload --no-verify-jwt
```

### 6. Включить вебхук бота

Подставь токен и URL проекта (из Project URL):

```
https://api.telegram.org/bot<ТОКЕН>/setWebhook?url=https://<PROJECT>.supabase.co/functions/v1/bot
```

Открой эту ссылку в браузере — должно вернуться `{"ok":true}`.

### 7. Сделать Аню админом

Аня пишет боту:

```
/me_admin <секретный_ключ_админа>
```

Бот ответит «Готово!» — теперь внутри Telegram у неё виден карандаш и можно редактировать.

---

## Деплой фронта на Vercel

1. Залей репозиторий на GitHub.
2. На [vercel.com](https://vercel.com) → **New Project** → импортируй репозиторий.
3. Framework preset: **Vite**. Build: `npm run build`, Output: `dist`.
4. В **Environment Variables** добавь `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `VITE_TELEGRAM_BOT_USERNAME` (юзернейм бота без `@`).
5. Deploy. Получишь ссылку вида `https://recipes-xxx.vercel.app`.

## Привязать Mini App к боту

В [@BotFather](https://t.me/BotFather): `/newapp` (или **Bot Settings → Menu Button**) →
укажи URL с Vercel. Теперь приложение открывается прямо в Telegram.

---

## Что где лежит

```
src/
├── app/          роутер, vue-query (one-shot), провайдеры
├── api/          BaseApi + <feature>.api.ts + resources (DTO)
├── repository/   фасады (фикстуры ↔ Supabase)
├── features/     categories, recipes, favorites, admin
├── pages/        Home, Category, Recipe, RecipeEditor
├── services/     modal.service, helpers
├── shared/ ui/   дизайн-система (карточки, чипы, кнопки, декор)
├── _shared/      ядро (api, telegram, modals, forms, helpers)
└── assets/scss/  Ghibli-палитра + миксины
supabase/
├── migrations/   0001_init.sql (схема + RLS + сид)
└── functions/    bot, recipe-upsert, recipe-delete, verify-admin
```
