-- ─────────────────────────────────────────────────────────────
-- 0003: фото у категорий + несколько фото у рецепта.
-- Записи в categories/recipes идут только через service_role (edge
-- functions) — новых RLS-политик не нужно, чтение уже публичное.
-- ─────────────────────────────────────────────────────────────

-- Картинка категории (необязательная; нет — плитка собирается из фото блюд).
alter table categories add column if not exists image_url text;

-- Галерея рецепта: массив { id, url }. cover_url = первое фото (ставит сервер).
alter table recipes add column if not exists images jsonb not null default '[]'::jsonb;

-- Бэкфилл: у кого была одиночная обложка — делаем её первым фото галереи.
update recipes
set images = jsonb_build_array(jsonb_build_object('id', gen_random_uuid()::text, 'url', cover_url))
where cover_url is not null
  and (images is null or images = '[]'::jsonb);
