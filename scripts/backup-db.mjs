// Бэкап данных Supabase без Docker/pg_dump: через `supabase db query --linked`
// (Management API, нужен только залогиненный и привязанный CLI).
//   npm run backup  →  backups/<дата_время>/{restore.sql, data/*.json, README.md}
// Схема БД — в supabase/migrations; здесь — данные + SQL для их восстановления.
// ВНИМАНИЕ: в бэкапе почты и хэши паролей — папка backups/ в .gitignore.
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

// Порядок важен для восстановления (внешние ключи).
const TABLES = [
  'auth.users',
  'auth.identities',
  'public.profiles',
  'public.super_admins',
  'public.categories',
  'public.recipes',
  'public.recipe_sections',
  'public.favorites',
]

// Профиль создаёт триггер при вставке в auth.users — поэтому upsert, иначе
// is_admin откатился бы к false.
const ON_CONFLICT = {
  'public.profiles': 'on conflict (id) do update set email = excluded.email, is_admin = excluded.is_admin',
}

function query(sql) {
  const dir = mkdtempSync(join(tmpdir(), 'sb-backup-'))
  const file = join(dir, 'q.sql')
  writeFileSync(file, sql)
  try {
    const out = execFileSync('supabase', ['db', 'query', '--linked', '-f', file], {
      encoding: 'utf8',
      shell: true,
      maxBuffer: 512 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return JSON.parse(out.slice(out.indexOf('{'))).rows
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

const stamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-')
const outDir = join('backups', stamp)
mkdirSync(join(outDir, 'data'), { recursive: true })

const restore = [
  `-- Восстановление данных из бэкапа ${stamp}.`,
  '-- Сначала схема: supabase/migrations/0001…0003, затем этот файл (SQL Editor → Run).',
  '-- Повторный запуск безопасен: существующие строки пропускаются.',
  'begin;',
  '',
]
const summary = []

for (const table of TABLES) {
  const [schema, name] = table.split('.')
  // Генерируемые колонки (напр. auth.users.confirmed_at) вставлять нельзя.
  const [{ cols }] = query(
    `select coalesce(json_agg(column_name::text order by ordinal_position), '[]') as cols
     from information_schema.columns
     where table_schema = '${schema}' and table_name = '${name}' and is_generated = 'NEVER'`,
  )
  const [{ data }] = query(`select coalesce(json_agg(t), '[]') as data from ${table} t`)

  writeFileSync(join(outDir, 'data', `${table}.json`), JSON.stringify(data, null, 2))
  summary.push(`${table}: ${data.length}`)
  console.log(`✓ ${table} — ${data.length}`)

  if (!data.length) continue
  const list = cols.map((c) => `"${c}"`).join(', ')
  restore.push(
    `-- ${table} (${data.length})`,
    `insert into ${table} (${list})`,
    `select ${list} from json_populate_recordset(null::${table}, $bk$${JSON.stringify(data)}$bk$::json)`,
    `${ON_CONFLICT[table] ?? 'on conflict do nothing'};`,
    '',
  )
}

restore.push('commit;', '')
writeFileSync(join(outDir, 'restore.sql'), restore.join('\n'))
writeFileSync(
  join(outDir, 'README.md'),
  [
    `# Бэкап ${stamp}`,
    '',
    ...summary.map((s) => `- ${s}`),
    '',
    '## Восстановление',
    '1. Новый/пустой проект: выполнить миграции `supabase/migrations/0001…0003` (SQL Editor).',
    '2. Выполнить `restore.sql` (SQL Editor → Run). Повторный запуск безопасен.',
    '3. Фото лежат в Storage (бакет `recipe-covers`) — в этот бэкап не входят.',
    '',
    '⚠️ Содержит почты и хэши паролей пользователей — не коммитить и не публиковать.',
    '',
  ].join('\n'),
)

console.log(`\nГотово: ${outDir}`)
