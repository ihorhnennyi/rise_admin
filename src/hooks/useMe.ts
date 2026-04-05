import { useEffect, useState } from 'react'
import { apiFetch } from '@admin/api/http'

export type Me = {
  id?: string
  userId?: string
  email: string
  role: string
}

export function useMe() {
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const data = await apiFetch<Me>('/auth/me')
        if (!cancelled) setMe(data)
      } catch {
        if (!cancelled) setMe(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  return { me, loading }
}

