import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { apiFetch, ApiError } from '@admin/api/http'
import type { MediaMention } from '@admin/types/media-mentions'
import { Button } from '@admin/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin/components/ui/card'
import { API_BASE_URL } from '@admin/api/config'
import { toastError } from '@admin/lib/toast'

function formatBadgeYear(iso: string | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return String(d.getFullYear())
}

export function MediaMentionsListPage() {
  const [items, setItems] = useState<MediaMention[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const data = await apiFetch<MediaMention[]>('/media-mentions')
        if (!cancelled) setItems(data)
      } catch (e) {
        if (!cancelled) setItems([])
        if (e instanceof ApiError && e.status === 401) return
        toastError('Помилка', 'Не вдалося завантажити записи.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
            Про нас у ЗМІ
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Картки з фото, заголовком, коротким описом, роком у бейджі та посиланням на матеріал.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/media-mentions/new">Додати запис</Link>
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</div>
      ) : items.length === 0 ? (
        <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
          <CardHeader>
            <CardTitle>Поки що порожньо</CardTitle>
            <CardDescription>Додай перший згадку у ЗМІ.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((m) => {
            const origin = API_BASE_URL.replace(/\/api$/, '')
            const imgSrc = m.imageUrl ? `${origin}${m.imageUrl}` : null
            const excerpt = (m.excerptUk ?? '').trim()
            const excerptShort = excerpt.length > 140 ? `${excerpt.slice(0, 140)}…` : excerpt
            return (
              <Card key={m._id} className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
                <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 p-4">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">{m.titleUk || '—'}</CardTitle>
                    <CardDescription className="text-xs">
                      Рік: {formatBadgeYear(m.publishedAt)}
                    </CardDescription>
                  </div>
                  <Button asChild variant="secondary" size="sm">
                    <Link to={`/media-mentions/${m._id}`}>Редагувати</Link>
                  </Button>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {imgSrc ? (
                    <div className="mb-2 overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.4)]">
                      <img
                        src={imgSrc}
                        alt=""
                        className="aspect-[21/9] w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                  {excerptShort ? (
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">{excerptShort}</div>
                  ) : null}
                  {m.href ? (
                    <div className="mt-2 truncate text-xs text-[hsl(var(--muted-foreground))]" title={m.href}>
                      {m.href}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
