import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useMe } from '@admin/hooks/useMe'

export function RequireSuperadmin({ children }: { children: ReactNode }) {
  const { me, loading } = useMe()

  if (loading) {
    return (
      <div className="text-sm text-[hsl(var(--muted-foreground))]">Завантаження…</div>
    )
  }

  if (me?.role !== 'superadmin') {
    return <Navigate to="/news" replace />
  }

  return children
}
