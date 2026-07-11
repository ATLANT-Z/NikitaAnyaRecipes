import { z } from 'zod'

// Типобезопасные пути к полям формы + фабрика плоской zod-схемы.
// Портировано из rockwheel. `any` в прокси — намеренная generic-инфра.
/* eslint-disable @typescript-eslint/no-explicit-any */

type CombinePath<P extends string, K extends string> = P extends '' ? K : `${P}.${K}`

type PathNode<T, P extends string> = (() => P) &
  (T extends (infer R)[]
    ? { readonly [K in number]: PathNode<R, `${P}[${number}]`> }
    : T extends object
      ? { readonly [K in keyof T & string]: PathNode<T[K], CombinePath<P, K>> }
      : unknown)

export type PathInto<T extends z.ZodTypeAny> =
  T extends z.ZodObject<infer Shape>
    ? { readonly [K in keyof Shape & string]: PathNode<z.infer<Shape[K]>, K> }
    : z.infer<T> extends object
      ? PathNode<z.infer<T>, ''>
      : never

export class FormHelper {
  // Прокси, динамически собирающий строковый путь к полю (fNames.a.b[0].c()).
  static names<T extends z.ZodTypeAny>(): PathInto<T> {
    const createProxy = (path: string[] = []): any => {
      const currentPath = path.filter(Boolean).join('.').replace(/\.\[/g, '[')
      const fn = () => currentPath
      return new Proxy(fn, {
        apply: () => currentPath,
        get(_, prop: string | symbol) {
          if (typeof prop !== 'string') return Reflect.get(fn, prop)
          const nextPath = [...path]
          const isIndex = !isNaN(Number(prop))
          if (isIndex && nextPath.length > 0) {
            nextPath[nextPath.length - 1] += `[${prop}]`
          } else {
            nextPath.push(prop)
          }
          return createProxy(nextPath)
        },
      })
    }
    return createProxy()
  }

  static createSchema<T>() {
    return <S extends { [K in keyof T]: z.ZodType<T[K]> }>(shape: S) => {
      return z.object(shape) as unknown as z.ZodType<T, z.ZodTypeDef, T> & { shape: S }
    }
  }
}
