import { v4 as uuid } from 'uuid'

// Транслит кириллицы для адресов вида /c/<slug>.
const TRANSLIT = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
  э: 'e', ю: 'yu', я: 'ya',
} as const satisfies Record<string, string>

export class SlugHelper {
  // «Супы и щи» → «supy-i-schi». Пусто после чистки — короткий случайный.
  static fromTitle(title: string): string {
    const slug = title
      .toLowerCase()
      .split('')
      .map((ch) => (TRANSLIT as Record<string, string>)[ch] ?? ch)
      .join('')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40)
    return slug || `cat-${uuid().slice(0, 8)}`
  }

  // Транслит теряет различия (ь/ъ, ё/е, ы/й): «Брат» и «Брать» → brat.
  // Занятый адрес получает номер: brat → brat-2 → brat-3.
  // То же правило продублировано в supabase/functions/category-upsert.
  static unique(base: string, taken: Iterable<string>): string {
    const used = new Set(taken)
    if (!used.has(base)) return base
    for (let n = 2; ; n++) {
      const suffix = `-${n}`
      const candidate = base.slice(0, 40 - suffix.length).replace(/-+$/, '') + suffix
      if (!used.has(candidate)) return candidate
    }
  }
}
