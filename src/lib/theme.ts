export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'admin:theme'
const EVENT_NAME = 'theme:change'

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const raw = window.localStorage.getItem(STORAGE_KEY)
  return raw === 'light' ? 'light' : 'dark'
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function setTheme(theme: Theme) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, theme)
  applyTheme(theme)
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: theme }))
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
}

export function onThemeChange(cb: (theme: Theme) => void) {
  const handler = (e: Event) => cb((e as CustomEvent).detail as Theme)
  window.addEventListener(EVENT_NAME, handler as any)
  return () => window.removeEventListener(EVENT_NAME, handler as any)
}

