import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin/components/ui/card'
import { Input } from '@admin/components/ui/input'
import { Label } from '@admin/components/ui/label'
import { Button } from '@admin/components/ui/button'
import { apiFetch, ApiError } from '@admin/api/http'
import { setTokens } from '@admin/routes/auth'

type LocationState = { from?: { pathname?: string } } | null

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState

  const redirectTo = useMemo(() => state?.from?.pathname ?? '/', [state?.from?.pathname])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      const data = await apiFetch<{ accessToken: string; refreshToken: string }>(
        '/auth/login',
        {
          method: 'POST',
          json: { email, password },
        },
      )
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken })
      navigate(redirectTo, { replace: true })
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError('Invalid email or password.')
      } else {
        setError('Login failed. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh w-full bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--accent)/0.35)_0%,transparent_55%),radial-gradient(40%_30%_at_20%_30%,hsl(var(--ring)/0.25)_0%,transparent_60%)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1100px] items-center justify-center px-4 py-10">
        <div className="w-full">
          <Card className="mx-auto w-full max-w-md bg-[hsl(var(--card)/0.65)] backdrop-blur">
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>Enter your credentials to access the admin panel.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={onSubmit}>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Signing in…' : 'Sign in'}
                </Button>

                {error ? (
                  <p className="text-center text-xs text-red-400">{error}</p>
                ) : (
                  <p className="text-center text-xs text-[hsl(var(--muted-foreground))]">
                    Use your admin credentials.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

