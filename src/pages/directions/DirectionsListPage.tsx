import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { apiFetch, ApiError } from '@admin/api/http'
import type { Direction } from '@admin/types/directions'
import { Button } from '@admin/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin/components/ui/card'
import { API_BASE_URL } from '@admin/api/config'
import { toastError } from '@admin/lib/toast'

export function DirectionsListPage() {
  const [items, setItems] = useState<Direction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const data = await apiFetch<Direction[]>('/directions')
        if (!cancelled) setItems(data)
      } catch (e) {
        if (!cancelled) setItems([])
        if (e instanceof ApiError && e.status === 401) return
        toastError('Помилка', 'Не вдалося завантажити напрямки.')
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
            Напрямки діяльності
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Картки на сайті: заголовок, опис, зображення. Проєкт обирається в картці проєкту.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/directions/new">Створити</Link>
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</div>
      ) : items.length === 0 ? (
        <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
          <CardHeader>
            <CardTitle>Поки що порожньо</CardTitle>
            <CardDescription>Створи перший напрямок.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((d) => {
            const origin = API_BASE_URL.replace(/\/api$/, '')
            const coverSrc = d.coverImageUrl ? `${origin}${d.coverImageUrl}` : null
            const excerptRaw = (d.excerptUk ?? d.excerpt ?? '') as string
            const excerpt =
              excerptRaw.length > 160 ? `${excerptRaw.slice(0, 160).trim()}…` : excerptRaw

            return (
              <Card
                key={d._id}
                className="flex flex-col overflow-hidden border-[hsl(var(--border))] bg-[hsl(var(--card)/0.65)] shadow-sm backdrop-blur transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[5/3] shrink-0 bg-[hsl(var(--muted)/0.35)]">
                  {coverSrc ? (
                    <img
                      src={coverSrc}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs font-medium text-[hsl(var(--muted-foreground))]">
                      Немає зображення картки
                    </div>
                  )}
                </div>

                <CardContent className="flex flex-1 flex-col gap-3 p-4">
                  <span className="inline-flex w-fit rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.2)] px-2.5 py-0.5 text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
                    Картка на головній
                  </span>

                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-[17px] font-semibold leading-snug tracking-tight">
                      {d.titleUk ?? d.title}
                    </CardTitle>
                    {d.updatedAt ? (
                      <CardDescription className="text-[12px]">
                        Оновлено: {new Date(d.updatedAt).toLocaleString('uk-UA')}
                      </CardDescription>
                    ) : null}
                  </div>

                  {excerpt ? (
                    <p className="line-clamp-3 text-[13px] leading-relaxed text-[hsl(var(--muted-foreground))]">
                      {excerpt}
                    </p>
                  ) : (
                    <p className="text-[13px] italic text-[hsl(var(--muted-foreground))]">Без опису</p>
                  )}

                  <div className="mt-auto border-t border-[hsl(var(--border))] pt-3">
                    <Button asChild variant="secondary" className="w-full" size="sm">
                      <Link to={`/directions/${d._id}`}>Редагувати</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
