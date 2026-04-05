import { API_BASE_URL } from '@admin/api/config'
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '@admin/routes/auth'

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null

export class ApiError extends Error {
  status: number
  data: unknown
  url?: string
  method?: string

  constructor(message: string, status: number, data: unknown, meta?: { url?: string; method?: string }) {
    super(message)
    this.status = status
    this.data = data
    this.url = meta?.url
    this.method = meta?.method
  }
}

async function readJsonSafe(res: Response): Promise<unknown> {
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return null
  try {
    return await res.json()
  } catch {
    return null
  }
}

let refreshInFlight: Promise<boolean> | null = null

async function refreshTokens(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  if (!res.ok) {
    clearTokens()
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth:logout'))
    }
    return false
  }

  const data = (await readJsonSafe(res)) as
    | { accessToken?: string; refreshToken?: string }
    | null

  if (!data?.accessToken || !data.refreshToken) {
    clearTokens()
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth:logout'))
    }
    return false
  }

  setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken })
  return true
  })()

  try {
    return await refreshInFlight
  } finally {
    refreshInFlight = null
  }
}

export async function apiFetch<T = Json>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`
  const method = (init.method ?? 'GET').toUpperCase()
  const headers = new Headers(init.headers)
  headers.set('accept', 'application/json')

  const token = getAccessToken()
  if (token) headers.set('authorization', `Bearer ${token}`)

  let body = init.body
  if ('json' in init) {
    headers.set('content-type', 'application/json')
    body = JSON.stringify(init.json)
  }

  const res = await fetch(url, { ...init, headers, body, cache: 'no-store' })
  const data = await readJsonSafe(res)

  if (res.ok) return data as T

  // Try refresh-once for 401
  if (res.status === 401) {
    const didRefresh = await refreshTokens()
    if (didRefresh) {
      const retryHeaders = new Headers(init.headers)
      retryHeaders.set('accept', 'application/json')
      const newToken = getAccessToken()
      if (newToken) retryHeaders.set('authorization', `Bearer ${newToken}`)
      if ('json' in init) retryHeaders.set('content-type', 'application/json')

      const retryRes = await fetch(url, { ...init, headers: retryHeaders, body, cache: 'no-store' })
      const retryData = await readJsonSafe(retryRes)
      if (retryRes.ok) return retryData as T

      if (retryRes.status === 401) {
        clearTokens()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:logout'))
        }
      }
      throw new ApiError(
        `Request failed: ${method} ${url} (${retryRes.status})`,
        retryRes.status,
        retryData,
        { url, method },
      )
    }
  }

  throw new ApiError(
    `Request failed: ${method} ${url} (${res.status})`,
    res.status,
    data,
    { url, method },
  )
}

