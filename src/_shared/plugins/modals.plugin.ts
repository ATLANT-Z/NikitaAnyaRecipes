import { ref, markRaw, type Component, shallowRef, type InjectionKey, inject, type Ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { useNotificationsStore } from '@/_shared/stores/notifications'
import type {
  ExtractComponentPublicProps,
  ExtractModalResult,
  ModalResult,
} from '@/_shared/types/vue-utils'

// Собственная система модалок (портирована из rockwheel).
// • Реестр: ключ → компонент, ModalsHelper.reg<TResult>(Component).
// • ОДИН компонент = ОДИН ключ (разница поведения — через props).
// • Открытие:  modals.show('key', { props }).wait  → Promise<TResult>
// • Внутри:    const { resolve, close, props } = useModal('key')

// TRes/TProps здесь намеренно any: это generic-инфра реестра модалок, где
// точные типы восстанавливаются на границе (show/useModal). Документированный
// паттерн — см. CLAUDE.md §Типизация.
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IActiveModal<TName = any, TRes = any, TProps = any> {
  id: string
  uid: string
  storageKey: string
  isSubmitting: Ref<boolean>

  name: TName
  props: TProps
  component: Component

  resolve: (val: TRes) => void
  close: () => void

  saveDraft: (data: Partial<TProps>) => void
  clearDraft: () => void
}

export class ModalsHelper {
  static reg<TOrigRes = unknown, T extends Component = Component>(component: T) {
    return component as T & ModalResult<TOrigRes>
  }

  static createService<R extends Record<string, Component & ModalResult<unknown>>>(registry: R) {
    const stack = shallowRef<IActiveModal<keyof R>[]>([])
    const persistenceCache = ref<Record<string, any>>({})

    function _saveDraft(storageKey: string, data: any) {
      persistenceCache.value[storageKey] = data
    }
    function _clearDraft(storageKey: string) {
      delete persistenceCache.value[storageKey]
    }
    function _close(uid: string) {
      stack.value = stack.value.filter((m) => m.uid !== uid)
    }

    class ModalContext<K extends keyof R> implements IActiveModal<
      K,
      ExtractModalResult<R[K]>,
      ExtractComponentPublicProps<R[K]>
    > {
      isSubmitting = ref(false)
      public onResolve: ((val: any) => void) | null = null

      constructor(
        public uid: string,
        public name: K,
        public component: Component,
        public props: ExtractComponentPublicProps<R[K]>,
        public storageKey: string,
      ) {}

      get id() {
        return `${String(this.name)}-${this.uid}`
      }

      resolve(value: any) {
        this.settle(value)
        _close(this.uid)
      }
      // Закрытие без результата (×, «Отмена», фон) тоже завершает .wait — null.
      // Иначе вызывающий код висел бы на await вечно.
      close() {
        this.settle(null)
        _close(this.uid)
      }
      private settle(value: any) {
        const done = this.onResolve
        this.onResolve = null
        done?.(value)
      }
      saveDraft(data: Partial<ExtractComponentPublicProps<R[K]>>) {
        _saveDraft(this.storageKey, data)
      }
      clearDraft() {
        _clearDraft(this.storageKey)
      }
    }

    interface ShowResult<K extends keyof R> {
      modal: ModalContext<K>
      wait: Promise<{ [P in K]: ExtractModalResult<R[P]> }[K] | null> // null — закрыли без ответа
    }

    type ShowConfig<K extends keyof R> = {
      props: ExtractComponentPublicProps<R[K]>
      persistenceId?: string
    }

    // Если у компонента нет обязательных пропсов — весь конфиг опционален.
    type ShowArgs<K extends keyof R> = K extends unknown
      ? object extends ExtractComponentPublicProps<R[K]>
        ? [config?: Partial<ShowConfig<K>>]
        : [config: ShowConfig<K>]
      : never

    function _show<K extends keyof R = keyof R>(name: K, ...args: ShowArgs<K>): ShowResult<K> {
      const { props, persistenceId } = args[0] || {}
      const uid = uuidv4()
      const storageKey = persistenceId ? `${String(name)}-${persistenceId}` : String(name)

      const cache = persistenceCache.value[storageKey] || {}
      const finalProps = { ...cache, ...props } as ExtractComponentPublicProps<R[K]>

      const newModal = new ModalContext<K>(
        uid,
        name,
        markRaw(registry[name]),
        finalProps,
        storageKey,
      )

      return {
        modal: newModal,
        wait: new Promise((resolve) => {
          newModal.onResolve = resolve
          stack.value = [...stack.value, newModal]
        }),
      }
    }

    return { stack, show: _show }
  }

  static createComposable<R extends Record<string, Component & ModalResult<unknown>>>(
    getRegistry: () => R,
  ) {
    return {
      useModal: <K extends keyof R = keyof R>(name: K) => {
        getRegistry()
        const context = inject(ModalContextKey, null) as IActiveModal<
          K,
          ExtractModalResult<R[K]>,
          ExtractComponentPublicProps<R[K]>
        > | null

        if (!context || name !== context.name) {
          throw new Error('useModal must be called inside the modal component')
        }
        const notifications = useNotificationsStore()

        return {
          context,
          uid: context.uid,
          name: context.name,
          props: context.props,
          isSubmitting: context.isSubmitting,
          notifications,
          resolve: context.resolve.bind(context),
          close: context.close.bind(context),
          saveDraft: context.saveDraft.bind(context),
          clearDraft: context.clearDraft.bind(context),
        }
      },
    }
  }
}

export type ModalService<RegistryType extends Record<string, Component & ModalResult<unknown>>> =
  ReturnType<typeof ModalsHelper.createService<RegistryType>>
export type UntypedModalService = ModalService<Record<string, Component & ModalResult<unknown>>>
export const ModalContextKey: InjectionKey<IActiveModal> = Symbol('ModalContext')
