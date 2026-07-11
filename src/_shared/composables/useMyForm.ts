import { toTypedSchema } from '@vee-validate/zod'
import { type FormOptions, useForm } from 'vee-validate'
import { computed, inject, onMounted, watch } from 'vue'
import { z } from 'zod'
import { FormHelper, type PathInto } from '@/_shared/helpers/form.helper'
import { ModalContextKey } from '@/_shared/plugins/modals.plugin'

interface IExtendValidation<T extends z.ZodTypeAny> {
  (schema: T, fNames: PathInto<T>): z.ZodTypeAny
}

type UseMyFormConfig<T extends z.ZodTypeAny> = {
  extendValidation?: IExtendValidation<T>
  persist?: boolean
} & FormOptions<z.infer<T>>

// Обёртка над vee-validate: zod-схема, typed fNames, submit c очисткой драфта модалки.
export function useMyForm<T extends z.ZodTypeAny>(schema: T, config: UseMyFormConfig<T>) {
  const { extendValidation, persist = true, ...formOptions } = config
  const fNames: PathInto<T> = FormHelper.names<T>()

  const modalContext = inject(ModalContextKey, null)
  const formContext = useForm({
    ...formOptions,
    validationSchema: toTypedSchema(extendValidation ? extendValidation(schema, fNames) : schema),
  })

  const { handleSubmit, resetForm, meta, isSubmitting, setValues } = formContext
  const isDisabled = computed(() => isSubmitting.value || meta.value.pending)

  const smartHandleSubmit = (fn: (values: z.infer<T>) => unknown) => {
    return handleSubmit(async (values) => {
      const result = await fn(values)
      if (persist && modalContext) {
        modalContext.clearDraft()
        resetForm()
      }
      return result
    })
  }

  onMounted(() => {
    if (persist && modalContext?.props && Object.keys(modalContext.props).length > 0) {
      setValues({ ...formOptions.initialValues, ...modalContext.props })
    }
  })

  watch(
    formContext.values,
    (newValues) => {
      if (persist && modalContext) modalContext.saveDraft({ ...newValues })
    },
    { deep: true },
  )

  return {
    ...formContext,
    fNames,
    isDisabled,
    handleSubmit: smartHandleSubmit,
  }
}
