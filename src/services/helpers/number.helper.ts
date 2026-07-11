// Форматирование чисел/денег/времени. Классы со static-методами.
// В шаблонах зовём напрямую: {{ NumberHelper.money(recipe.cost) }}.
export class NumberHelper {
  static readonly LOCALE = 'ru-RU'

  // 1482 → "1 482"
  static format(n: number): string {
    return new Intl.NumberFormat(NumberHelper.LOCALE).format(n)
  }

  // 300 → "300 ₽"
  static money(n: number): string {
    return `${NumberHelper.format(n)} ₽`
  }

  // Округление до 2 знаков (для пересчёта порций).
  static round(n: number, digits = 2): number {
    const p = 10 ** digits
    return Math.round(n * p) / p
  }

  // Парсит "1,5" и "1.5" → 1.5. NaN → null.
  static parseDecimal(raw: string): number | null {
    const value = Number(raw.replace(',', '.').trim())
    return Number.isFinite(value) ? value : null
  }
}

export class TimeHelper {
  // 60 → "1 ч", 90 → "1 ч 30 мин", 45 → "45 мин"
  static duration(minutes: number): string {
    if (minutes < 60) return `${minutes} мин`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m ? `${h} ч ${m} мин` : `${h} ч`
  }
}
