import { useCallback, useEffect, useRef } from 'react'

type Options = {
  loading: boolean
  /** Чи відрізняється форма від останнього збереженого стану (initialRef / baseline). */
  isDirty: boolean
  /** Стабільний JSON-снимок форми — щоб debounce перезапускався при кожній зміні тексту. */
  patchJson: string
  saveSilent: () => Promise<void>
  debounceMs?: number
}

/**
 * Debounced автозбереження + попередження при закритті вкладки з незбереженими змінами.
 * Батьківський `save({ silent: true })` має оновити baseline так, щоб `isDirty` став false.
 */
export function usePersistedJsonAutosave({ loading, isDirty, patchJson, saveSilent, debounceMs = 400 }: Options) {
  const saveSilentRef = useRef(saveSilent)
  saveSilentRef.current = saveSilent

  const loadingRef = useRef(loading)
  loadingRef.current = loading

  const isDirtyRef = useRef(isDirty)
  isDirtyRef.current = isDirty

  useEffect(() => {
    if (loading || !isDirty) return
    const t = window.setTimeout(() => {
      void saveSilentRef.current()
    }, debounceMs)
    return () => window.clearTimeout(t)
  }, [patchJson, loading, isDirty, debounceMs])

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (loadingRef.current) return
      if (!isDirtyRef.current) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  const persistBlur = useCallback(() => {
    if (!isDirtyRef.current) return
    void saveSilentRef.current()
  }, [])

  return { persistBlur }
}
