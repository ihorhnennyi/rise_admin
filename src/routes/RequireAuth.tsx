import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getAccessToken, getRefreshToken, isAuthed } from '@admin/routes/auth'
import { apiFetch } from '@admin/api/http'

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [ready, setReady] = useState(() => Boolean(getAccessToken()) || !getRefreshToken())
  const [authTick, setAuthTick] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function ensureSession() {
      // If we don't have an access token but do have a refresh token,
      // hit a protected endpoint to trigger refresh-once logic.
      if (!getAccessToken() && getRefreshToken()) {
        try {
          await apiFetch('/auth/me')
        } catch {
          // ignore; redirect below
        }
      }
      if (!cancelled) setReady(true)
    }

    void ensureSession()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function onLogout() {
      setAuthTick((x) => x + 1)
    }
    window.addEventListener('auth:logout', onLogout)
    return () => window.removeEventListener('auth:logout', onLogout)
  }, [])

  if (!ready) {
    return (
      <div className="min-h-dvh w-full grid place-items-center text-sm text-[hsl(var(--muted-foreground))]">
        Loading…
      </div>
    )
  }

  void authTick
  if (!isAuthed()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

