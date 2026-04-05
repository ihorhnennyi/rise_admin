/** Стан «секція розгорнута» для AdminSectionShell (1 / 0 у localStorage). */
export function readStoredSectionOpen(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback
  try {
    const v = localStorage.getItem(key)
    if (v === '1' || v === 'true') return true
    if (v === '0' || v === 'false') return false
  } catch {
    /* ignore */
  }
  return fallback
}

export function writeStoredSectionOpen(key: string, open: boolean) {
  try {
    localStorage.setItem(key, open ? '1' : '0')
  } catch {
    /* ignore */
  }
}

/** Масив «згорнуто?» у порядку елементів списку (редактор контенту). */
export function readCollapsedBooleanArray(storageKey: string): boolean[] | null {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw == null) return null
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    return parsed.map((x) => !!x)
  } catch {
    return null
  }
}

export function writeCollapsedBooleanArray(
  storageKey: string,
  orderedKeys: string[],
  collapsedByKey: Record<string, boolean>,
  defaultCollapsed = true,
) {
  try {
    const arr = orderedKeys.map((k) =>
      Object.prototype.hasOwnProperty.call(collapsedByKey, k) ? collapsedByKey[k]! : defaultCollapsed,
    )
    localStorage.setItem(storageKey, JSON.stringify(arr))
  } catch {
    /* ignore */
  }
}

/** Відновлення Record<__key, collapsed> після перезавантаження (нові __key, той самий порядок рядків). */
export function collapsedArrayToMap(
  orderedKeys: string[],
  arr: boolean[] | null,
  defaultCollapsed = true,
): Record<string, boolean> {
  const m: Record<string, boolean> = {}
  if (!arr) return m
  orderedKeys.forEach((k, i) => {
    m[k] = arr[i] ?? defaultCollapsed
  })
  return m
}
