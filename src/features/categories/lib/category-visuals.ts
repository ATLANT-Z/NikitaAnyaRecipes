type Tone = 'sky' | 'meadow' | 'sun' | 'peach' | 'lavender' | 'neutral'

// Ghibli-оттенок для плитки категории. Неизвестный slug → мягкий нейтральный.
const TONE_BY_SLUG = {
  soup: 'sun',
  hot: 'peach',
  salad: 'meadow',
  snack: 'lavender',
  dessert: 'peach',
  drink: 'sky',
  baking: 'sun',
  cake: 'lavender',
} as const satisfies Record<string, Tone>

export class CategoryVisuals {
  static tone(slug: string): Tone {
    return (TONE_BY_SLUG as Record<string, Tone>)[slug] ?? 'neutral'
  }
}
