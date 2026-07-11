-- ─────────────────────────────────────────────────────────────
-- Схема БД приложения «Рецепты».
-- Секции денормализованы: ингредиенты/замены/шаги/хранение хранятся
-- jsonb-массивами внутри recipe_sections (всегда читаем/пишем секцию целиком).
-- ─────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- Категории ------------------------------------------------------
create table if not exists categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  title      text not null,
  sort_order int  not null default 0
);

-- Рецепты --------------------------------------------------------
create table if not exists recipes (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  category_slug text not null references categories(slug) on update cascade,
  cover_url     text,
  time_minutes  int  not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists recipes_category_idx on recipes (category_slug);

-- Секции («составные ингредиенты»: Тесто/Крем/Основа) ------------
create table if not exists recipe_sections (
  id            uuid primary key default gen_random_uuid(),
  recipe_id     uuid not null references recipes(id) on delete cascade,
  title         text not null,
  sort_order    int  not null default 0,
  servings      text,
  cost          numeric,
  kbju          jsonb,                     -- { cal, prot, fat, carb }
  ingredients   jsonb not null default '[]'::jsonb,  -- [{ id, amount, name }]
  substitutions jsonb not null default '[]'::jsonb,  -- [{ id, marker, text }]
  steps         jsonb not null default '[]'::jsonb,  -- ["шаг 1", ...]
  storage       jsonb not null default '[]'::jsonb   -- [{ id, place, duration }]
);
create index if not exists sections_recipe_idx on recipe_sections (recipe_id);

-- Админы (Telegram id) — пишет только сервер (edge functions) ----
create table if not exists admins (
  telegram_id bigint primary key,
  created_at  timestamptz not null default now()
);

-- Избранное — общее на всех -------------------------------------
create table if not exists favorites (
  recipe_id  uuid primary key references recipes(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ─── RLS ───────────────────────────────────────────────────────
alter table categories      enable row level security;
alter table recipes         enable row level security;
alter table recipe_sections enable row level security;
alter table admins          enable row level security;
alter table favorites       enable row level security;

-- Публичное ЧТЕНИЕ (anon-ключ с фронта).
create policy "read categories" on categories for select using (true);
create policy "read recipes"    on recipes    for select using (true);
create policy "read sections"   on recipe_sections for select using (true);

-- Избранное: чтение + тоггл открыты (семейное приложение).
create policy "read favorites"   on favorites for select using (true);
create policy "insert favorites" on favorites for insert with check (true);
create policy "delete favorites" on favorites for delete using (true);

-- Записи в recipes/recipe_sections и таблицу admins — политик НЕТ:
-- значит доступ только через service_role (edge functions), что и нужно.

-- ─── Storage: бакет обложек (публичное чтение) ─────────────────
insert into storage.buckets (id, name, public)
values ('recipe-covers', 'recipe-covers', true)
on conflict (id) do nothing;

create policy "public read covers"
  on storage.objects for select
  using (bucket_id = 'recipe-covers');

-- ─── Сид категорий ─────────────────────────────────────────────
insert into categories (slug, title, sort_order) values
  ('soup',    'Суп',      1),
  ('hot',     'Горячее',  2),
  ('salad',   'Салат',    3),
  ('snack',   'Закуски',  4),
  ('dessert', 'Десерт',   5),
  ('drink',   'Напиток',  6),
  ('baking',  'Выпечка',  7),
  ('cake',    'Торт',     8)
on conflict (slug) do nothing;
