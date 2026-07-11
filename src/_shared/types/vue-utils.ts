import type { VNodeProps, AllowedComponentProps, ComponentCustomProps } from 'vue'

// Извлечь публичные пропсы компонента (без служебных vue-полей).
type VueInternalProps = keyof VNodeProps | keyof AllowedComponentProps | keyof ComponentCustomProps

export type ExtractComponentPublicProps<T> = T extends new (...args: never[]) => {
  $props: infer P
}
  ? { [K in keyof P as K extends VueInternalProps ? never : K]: P[K] }
  : T extends (props: infer P, ...args: never[]) => unknown
    ? P
    : never

// Тег-«фантом» для протаскивания типа результата модалки через реестр.
export type ModalResult<T> = { my__res?: T | null }

export type ExtractModalResult<T> = T extends { my__res?: infer R | null }
  ? R
  : T extends { new (...args: never[]): { my__res?: infer R | null } }
    ? R
    : T extends { setup?: (...args: never[]) => { my__res?: infer R | null } }
      ? R
      : unknown
