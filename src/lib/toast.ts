export type ToastVariant = 'success' | 'error' | 'info'

export type ToastPayload = {
  id?: string
  title: string
  description?: string
  variant?: ToastVariant
  durationMs?: number
}

const EVENT_NAME = 'app:toast'

export function toast(payload: ToastPayload) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }))
}

export function toastSuccess(title: string, description?: string) {
  toast({ title, description, variant: 'success' })
}

export function toastError(title: string, description?: string) {
  toast({ title, description, variant: 'error' })
}

export function toastInfo(title: string, description?: string) {
  toast({ title, description, variant: 'info' })
}

export function onToast(cb: (payload: ToastPayload) => void) {
  const handler = (e: Event) => cb((e as CustomEvent).detail as ToastPayload)
  window.addEventListener(EVENT_NAME, handler as any)
  return () => window.removeEventListener(EVENT_NAME, handler as any)
}

