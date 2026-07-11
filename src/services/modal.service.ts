// Глобальный реестр модалок. ОДНА модалка = ОДИН ключ; разница поведения — через props.
// Открытие:  const modals = useModals(); modals.show('key', { props }).wait
// Внутри:    const { resolve, close, props } = useModal('key')
//
// Пока пусто — модалки (создание/редактирование рецептов и т.п.) добавим на этапе edit-режима.

import { inject, type InjectionKey } from 'vue'
import { ModalsHelper } from '@/_shared/plugins/modals.plugin'
import ConfirmModal from '@/_shared/components/modals/ConfirmModal.vue'

const REGISTRY = {
  confirm: ModalsHelper.reg<boolean>(ConfirmModal),
} as const

export type ModalName = keyof typeof REGISTRY

export const modalService = ModalsHelper.createService(REGISTRY)
export type ModalService = typeof modalService

export const ModalServiceKey: InjectionKey<ModalService> = Symbol('ModalService')
export const useModals = () => inject(ModalServiceKey)!

export const { useModal } = ModalsHelper.createComposable(() => REGISTRY)
