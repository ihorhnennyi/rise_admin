import { Button } from '@admin/components/ui/button'
import { apiFetch } from '@admin/api/http'
import { useMe } from '@admin/hooks/useMe'
import { clearTokens, getRefreshToken } from '@admin/routes/auth'
import { Moon, Shield, Sun } from 'lucide-react'
import { getTheme, onThemeChange, toggleTheme } from '@admin/lib/theme'
import { useEffect, useState } from 'react'

export function AppHeader({ onLoggedOut }: { onLoggedOut: () => void }) {
  const { me } = useMe()
  const [theme, setTheme] = useState(() => getTheme())

  const initials =
    (me?.email?.trim()?.[0] ?? 'U').toUpperCase()

  useEffect(() => {
    return onThemeChange(setTheme)
  }, [])

  return (
    <header className="sticky top-0 z-20 w-full border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.7)] backdrop-blur">
      <div className="flex h-14 w-full items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-3">
          <div
            className="grid size-9 place-items-center rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.6)] text-[hsl(var(--foreground))] shadow-sm"
            aria-label="Rise Admin"
            title="Rise Admin"
          >
            <Shield className="size-4" />
          </div>
          <div className="font-semibold tracking-tight text-[hsl(var(--foreground))]">
            Rise
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-9 w-9 px-0"
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Dark' : 'Light'}
            onClick={() => toggleTheme()}
          >
            {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <div className="text-sm font-medium text-[hsl(var(--foreground))]">
              {me?.email ?? 'User'}
            </div>
            <div className="text-xs text-[hsl(var(--muted-foreground))]">
              {me?.role ?? '—'}
            </div>
          </div>
          <div className="grid size-9 place-items-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.6)] text-sm font-semibold text-[hsl(var(--foreground))]">
            {initials}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              const refreshToken = getRefreshToken()
              try {
                if (refreshToken) {
                  await apiFetch('/auth/logout', {
                    method: 'POST',
                    json: { refreshToken },
                  })
                }
              } finally {
                clearTokens()
                onLoggedOut()
              }
            }}
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}

