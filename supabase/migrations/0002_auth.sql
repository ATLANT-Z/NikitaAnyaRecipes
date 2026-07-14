-- ─────────────────────────────────────────────────────────────
-- Авторизация: браузерный вход email+пароль (Supabase Auth).
-- Просмотр рецептов остаётся публичным. Редактирование — только админам.
-- Супер-админ — Telegram-личность (кто знает ADMIN_SECRET в боте); он раздаёт
-- админки обычным пользователям по email. Роли обычных юзеров — флаг is_admin.
-- ─────────────────────────────────────────────────────────────

-- Профили пользователей (1:1 к auth.users) ----------------------
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Пользователь видит свой профиль (фронт по нему понимает, админ ли он).
create policy "read own profile" on profiles
  for select using (auth.uid() = id);

-- Менять is_admin можно ТОЛЬКО через service_role (бот/edge). Политик на
-- update/insert нет — значит с anon/authed это недоступно.

-- Профиль заводится автоматически при регистрации.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Супер-админы (Telegram id) — только для бота -------------------
create table if not exists super_admins (
  telegram_id bigint primary key,
  created_at  timestamptz not null default now()
);
alter table super_admins enable row level security;
-- Политик нет: доступ только через service_role (бот).

-- Старую таблицу admins (Telegram-админы приложения) больше не используем:
-- админ приложения теперь = profiles.is_admin, ставится ботом-суперадмином.
drop table if exists admins;
